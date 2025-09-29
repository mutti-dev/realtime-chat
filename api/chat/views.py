from django.contrib.auth import authenticate
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import UserSerializer, SignUpSerializer, ProfileUpdateSerializer
from rest_framework import status
from django.db import transaction
from django.shortcuts import get_object_or_404
from .models import Connection, Message
from .serializers import MessageSerializer
from .consumers import ChatConsumer
from django.conf import settings
from chat.utils import upload_to_r2, generate_r2_presigned_url

def get_auth_for_user(user):
    tokens = RefreshToken.for_user(user)
    return {
        "user": UserSerializer(user).data,
        "tokens": {
            "access": str(tokens.access_token),
            "refresh": str(tokens),
        },
    }


class SignInView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response({"detail": "Missing username or password"}, status=400)

        user = authenticate(username=username, password=password)
        if not user:
            return Response({"detail": "Invalid credentials"}, status=401)

        # Your existing helper (returns base user + tokens)
        user_data = get_auth_for_user(user)

        # Build final user dict with extra fields merged in
        final_user = {
            **user_data["user"],  # existing user fields
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
            "permissions": list(user.get_all_permissions()),
            "groups": list(user.groups.values_list("name", flat=True)),
        }

        return Response(
            {
                "user": final_user,
                "tokens": user_data["tokens"],
            }
        )



class SignUpView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        new_user = SignUpSerializer(data=request.data)
        new_user.is_valid(raise_exception=True)
        user = new_user.save()

        user_data = get_auth_for_user(user)

        return Response(user_data)







class ProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        """
        Accepts multipart/form-data (thumbnail) or JSON for profile updates.
        Example multipart/form-data keys:
          - thumbnail (file)
          - first_name, last_name, password
        Example JSON:
          { "first_name": "...", "password": "...", "settings": {...}, "theme": "dark" }
        """

        print("Profile update request data:", request.data.get('thumbnail'))
        user = request.user
        
        if not user or not user.is_authenticated:
            return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

        # Parse incoming data via serializer for validation (works for both form and json)
        serializer = ProfileUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Support a single "name" field from client and split into first/last if provided
        name = request.data.get("name")
        if name and "first_name" not in data and "last_name" not in data:
            parts = name.strip().split(" ", 1)
            data["first_name"] = parts[0]
            data["last_name"] = parts[1] if len(parts) > 1 else ""

        try:
            with transaction.atomic():
                thumbnail_file = request.FILES.get('thumbnail')
                if thumbnail_file:
                    # Try upload to R2 if configured, otherwise fall back to default storage.save()
                    from chat.utils import upload_to_r2
                    r2_url = upload_to_r2(thumbnail_file, prefix="thumbnails/")
                    if r2_url:
                        # store the external URL string in the field name (serializer will handle returning it)
                        user.thumbnail = r2_url
                    else:
                        user.thumbnail.save(thumbnail_file.name, thumbnail_file, save=False)

                # basic name fields
                if 'first_name' in data:
                    user.first_name = data.get('first_name') or ''
                if 'last_name' in data:
                    user.last_name = data.get('last_name') or ''

                # password change (use set_password)
                if 'password' in data and data.get('password'):
                    user.set_password(data.get('password'))

                # theme / notifications
                if 'theme' in data:
                    if hasattr(user, 'theme'):
                        user.theme = data.get('theme')
                if 'notifications_enabled' in data:
                    if hasattr(user, 'notifications_enabled'):
                        user.notifications_enabled = bool(data.get('notifications_enabled'))

                # arbitrary settings JSON
                if 'settings' in data:
                    if hasattr(user, 'settings'):
                        # merge existing settings with incoming
                        current = user.settings or {}
                        merged = {**current, **(data.get('settings') or {})}
                        user.settings = merged

                user.save()
        except Exception as e:
            return Response({"detail": "Failed to update profile", "error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # return the updated user
        out = UserSerializer(user)
        return Response(out.data, status=status.HTTP_200_OK)



 
#isko test krna hy..... 
class MessageUploadView(APIView):
    permission_classes = [IsAuthenticated]
    

    def post(self, request, *args, **kwargs):
        user = request.user
        connection_id = request.data.get("connectionId")
        text = request.data.get("text", "")

        if not connection_id:
            return Response({"error": "connectionId is required"}, status=400)

        connection = get_object_or_404(Connection, id=connection_id)

        file = request.FILES.get("file")  # multipart upload
        if not file and not text.strip():
            return Response({"error": "Either file or text is required"}, status=400)

        max_size_mb = 10
        if file and file.size > max_size_mb * 1024 * 1024:
            return Response({"error": f"File too large. Max {max_size_mb}MB allowed"}, status=400)

        file_key = None
        mime_type = None
        size = None
        r2_url = None
        
        try:
            if file:
                r2_url = upload_to_r2(file, prefix="messages_media/")
                # Set fields for serializer
                file_key = r2_url.replace(f"{settings.AWS_S3_BASE_URL}/", "")
                mime_type = file.content_type
                size = file.size
        except Exception:
            r2_url = None

        if r2_url:

            message = Message.objects.create(
                connection=connection,
                user=user,
                text=text,
                file_key=file_key,
                presigned_file_url = generate_r2_presigned_url(file_key) if file_key else None,
                mime_type=mime_type,
                size=size,
            )
            print("Uploaded to R2, stored URL in FileField:", r2_url)
        else:
            # fallback to default storage
            message = Message.objects.create(
                connection=connection,
                user=user,
                text=text,
                file=file if file else None,
                file_key=file.name if file else None,
                presigned_file_url = generate_r2_presigned_url(file.name) if file else None,
                mime_type=file.content_type if file else None,
                size=file.size if file else None,
            )
            print("Uploaded to DB:", file.name if file else None)
            print("r2_url:", r2_url)

        recipient = connection.sender if connection.sender != user else connection.receiver

        # Sender event
        serialized_message_sender = MessageSerializer(message, context={"user": user, "request": request})
        data_sender = {
            "message": serialized_message_sender.data,
            "friend": {"id": recipient.id, "username": recipient.username},
        }
        ChatConsumer.send_group(user.username, "message.send", data_sender)

        # Recipient event
        serialized_message_recipient = MessageSerializer(message, context={"user": recipient, "request": request})
        data_recipient = {
            "message": serialized_message_recipient.data,
            "friend": {"id": user.id, "username": user.username},
        }
        ChatConsumer.send_group(recipient.username, "message.send", data_recipient)

        return Response(serialized_message_sender.data, status=201)