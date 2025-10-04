from rest_framework import serializers
from .models import ChatGroup, GroupMember, GroupMessage
from chat.serializers import UserSerializer
from chat.models import User



class GroupMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = GroupMember
        fields = ["id", "user", "joined_at"]


class ChatGroupSerializer(serializers.ModelSerializer):
    # write_only: request ke liye, flexible banane ke liye CharField use karenge
    members = serializers.CharField(write_only=True, required=False)
    members_detail = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ChatGroup
        fields = ["id", "name", "created_by", "members", "members_detail", "created_at"]
        read_only_fields = ["created_by", "created_at"]

    def get_members_detail(self, obj):
        return [m.user.username for m in obj.groupmember_set.all()]

    def create(self, validated_data):
        members_raw = validated_data.pop("members", "")
        group = ChatGroup.objects.create(**validated_data)

        # creator ko hamesha member banao
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            GroupMember.objects.create(group=group, user=request.user)

        # members add
        self._add_members(group, members_raw)
        return group

    def update(self, instance, validated_data):
        members_raw = validated_data.pop("members", "")
        instance = super().update(instance, validated_data)
        self._add_members(instance, members_raw)
        return instance

    def _add_members(self, group, members_raw):
        from chat.models import User

        # string → list
        if isinstance(members_raw, str):
            members = [m.strip() for m in members_raw.split(",") if m.strip()]
        elif isinstance(members_raw, list):
            members = members_raw
        else:
            members = []

        for username in members:
            try:
                user = User.objects.get(username=username)
                GroupMember.objects.get_or_create(group=group, user=user)
            except User.DoesNotExist:
                continue


class GroupMessageSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    class Meta:
        model = GroupMessage
        fields = ["id", "user", "text", "created_at"]
