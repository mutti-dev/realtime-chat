import mimetypes
from rest_framework import serializers
from .models import User, Connection, Message



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
			'password': {
				# Ensures that when serializing, this field will be excluded
				'write_only': True
			}
		}

	def create(self, validated_data):
		# Clean all values, set as lowercase
		username   = validated_data['username'].lower()
		first_name = validated_data['first_name'].lower()
		last_name  = validated_data['last_name'].lower()
		# Create new user
		user = User.objects.create(
			username=username,
			first_name=first_name,
			last_name=last_name
		)
		password = validated_data['password']
		user.set_password(password)
		user.save()
		return user


class UserSerializer(serializers.ModelSerializer):
	name = serializers.SerializerMethodField()

	class Meta:
		model = User
		fields = [
			'id',
			'username',
			'name',
			'thumbnail',
			'is_online',
			'last_online',
			'is_admin',
			# new fields exposed to client
			'theme',
			'notifications_enabled',
			'settings',
		]

	def get_name(self, obj):
		fname = (obj.first_name or '').capitalize()
		lname = (obj.last_name or '').capitalize()
		return (fname + ' ' + lname).strip()

class SearchSerializer(UserSerializer):
	status = serializers.SerializerMethodField()

	class Meta:
		model = User
		fields = [
			'username',
			'name',
			'thumbnail',
			'status'
		]
	
	def get_status(self, obj):
		if obj.pending_them:
			return 'pending-them'
		elif obj.pending_me:
			return 'pending-me'
		elif obj.connected:
			return 'connected'
		return 'no-connection'


class RequestSerializer(serializers.ModelSerializer):
	sender = UserSerializer()
	receiver = UserSerializer()

	class Meta:
		model = Connection
		fields = [
			'id',
			'sender',
			'receiver',
			'created'
		]


class FriendSerializer(serializers.ModelSerializer):
	friend = serializers.SerializerMethodField()
	preview = serializers.SerializerMethodField()
	updated = serializers.SerializerMethodField()
	
	class Meta:
		model = Connection
		fields = [
			'id',
			'friend',
			'preview',
			'updated'
		]

	def get_friend(self, obj):
		# If Im the sender
		if self.context['user'] == obj.sender:
			return UserSerializer(obj.receiver).data
		# If Im the receiver
		elif self.context['user'] == obj.receiver:
			return UserSerializer(obj.sender).data
		else:
			print('Error: No user found in friendserializer')

	def get_preview(self, obj):
		default = 'New connection'
		if not hasattr(obj, 'latest_text'):
			return default
		return obj.latest_text or default

	def get_updated(self, obj):
		if not hasattr(obj, 'latest_created'):
			date = obj.updated
		else:
			date = obj.latest_created or obj.updated
		return date.isoformat()




class MessageSerializer(serializers.ModelSerializer):
    is_me = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    file_type = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            "id",
            "is_me",
            "text",
            "created",
            "file",
            "file_url",
            "file_type",
            "is_ai",
        ]

    def get_is_me(self, obj):
        return self.context["user"] == obj.user

    def get_file_url(self, obj):
        """Return absolute file URL if file is attached"""
        if obj.file:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

    def get_file_type(self, obj):
        """Detect file type (image, video, audio, document)"""
        if not obj.file:
            return None

        mime_type, _ = mimetypes.guess_type(obj.file.name)
        if not mime_type:
            return "document"

        if mime_type.startswith("image/"):
            return "image"
        elif mime_type.startswith("video/"):
            return "video"
        elif mime_type.startswith("audio/"):
            return "audio"
        else:
            return "document"


class ProfileUpdateSerializer(serializers.Serializer):
    # Optional fields for updating profile
    first_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    password = serializers.CharField(required=False, write_only=True, allow_blank=False, min_length=6)
    # settings / preferences
    theme = serializers.ChoiceField(choices=(('light','Light'),('dark','Dark')), required=False, allow_null=True)
    notifications_enabled = serializers.BooleanField(required=False)
    settings = serializers.JSONField(required=False)

    def validate(self, attrs):
        # Add any cross-field validation if required
        return attrs
