import mimetypes
from rest_framework import serializers
from .models import User, Connection, Message
from django.conf import settings


class SignUpSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'username',
            'first_name',
            'last_name',
            'password'
        ]
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        username = validated_data['username'].lower()
        first_name = validated_data['first_name'].lower()
        last_name = validated_data['last_name'].lower()
        user = User.objects.create(
            username=username,
            first_name=first_name,
            last_name=last_name
        )
        password = validated_data['password']
        user.set_password(password)
        user.save()
        return user


# ---------------- USER ----------------
class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'name',
            'first_name',
            'last_name',
            'thumbnail_url',
            'is_online',
            'last_online',
            'is_admin',
            'settings',
        ]

    def get_name(self, obj):
        fname = (obj.first_name or '').capitalize()
        lname = (obj.last_name or '').capitalize()
        return (fname + ' ' + lname).strip()

    def get_thumbnail_url(self, obj):
        """Return presigned URL for R2-stored thumbnail"""
        val = getattr(obj, "thumbnail", None)  # now stores R2 key
        if not val:
            return None
        try:
            from chat.utils import generate_r2_presigned_url
            return generate_r2_presigned_url(val, expires_in=3600)
        except Exception:
            return None


# ---------------- SEARCH ----------------
class SearchSerializer(UserSerializer):
    status = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'username',
            'name',
            'thumbnail_url',
            'status'
        ]

    def get_status(self, obj):
        if getattr(obj, "pending_them", False):
            return 'pending-them'
        elif getattr(obj, "pending_me", False):
            return 'pending-me'
        elif getattr(obj, "connected", False):
            return 'connected'
        return 'no-connection'


# ---------------- CONNECTION REQUEST ----------------
class RequestSerializer(serializers.ModelSerializer):
    sender = UserSerializer()
    receiver = UserSerializer()

    class Meta:
        model = Connection
        fields = ['id', 'sender', 'receiver', 'created']


# ---------------- FRIEND ----------------
class FriendSerializer(serializers.ModelSerializer):
    friend = serializers.SerializerMethodField()
    preview = serializers.SerializerMethodField()
    updated = serializers.SerializerMethodField()

    class Meta:
        model = Connection
        fields = ['id', 'friend', 'preview', 'updated']

    def get_friend(self, obj):
        if self.context['user'] == obj.sender:
            return UserSerializer(obj.receiver, context=self.context).data
        elif self.context['user'] == obj.receiver:
            return UserSerializer(obj.sender, context=self.context).data
        return None

    def get_preview(self, obj):
        default = 'New connection'
        return getattr(obj, 'latest_text', None) or default

    def get_updated(self, obj):
        date = getattr(obj, 'latest_created', None) or obj.updated
        return date.isoformat()


# ---------------- MESSAGE ----------------
class MessageSerializer(serializers.ModelSerializer):
    is_me = serializers.SerializerMethodField()
    presigned_file_url = serializers.SerializerMethodField()
    file_type = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            "id",
            "is_me",
            "text",
            "created",
            "presigned_file_url",
            "file_type",
            "file_key",   # ✅ store raw key in DB
            "mime_type",
            "size",
            "status",
        ]

    def get_is_me(self, obj):
        return self.context["user"] == obj.user

    def get_presigned_file_url(self, obj):
        """Return a temporary pre-signed URL if file_key exists"""
        if not obj.file_key:
            return None
        from chat.utils import generate_r2_presigned_url
        return generate_r2_presigned_url(obj.file_key, expires_in=3600)

    def get_file_type(self, obj):
        """Detect file type (image, video, audio, document)"""
        if not obj.file_key:
            return None
        mime_type = obj.mime_type or mimetypes.guess_type(obj.file_key)[0]
        if not mime_type:
            return "document"
        if mime_type.startswith("image/"):
            return "image"
        elif mime_type.startswith("video/"):
            return "video"
        elif mime_type.startswith("audio/"):
            return "audio"
        return "document"


# ---------------- PROFILE UPDATE ----------------
class ProfileUpdateSerializer(serializers.Serializer):
    first_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    password = serializers.CharField(required=False, write_only=True, min_length=6)
    theme = serializers.ChoiceField(
        choices=(('light','Light'),('dark','Dark')),
        required=False,
        allow_null=True
    )
    notifications_enabled = serializers.BooleanField(required=False)
    settings = serializers.JSONField(required=False)

    def validate(self, attrs):
        return attrs
