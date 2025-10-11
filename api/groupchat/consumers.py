import json
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
from .models import ChatGroup, GroupMember, GroupMessage
from .serializers import GroupMessageSerializer, ChatGroupSerializer
from chat.models import User


class GroupChatConsumer(WebsocketConsumer):

    def connect(self):
        user = self.scope["user"]
        if not user.is_authenticated:
            # Reject connection if anonymous
            return
        # Accept and register this channel in a per-user group so server can notify the user
        self.accept()
        try:
            async_to_sync(self.channel_layer.group_add)(self.scope["user"].username, self.channel_name)
        except Exception:
            # best-effort: if channel layer not available, still continue
            pass

    def disconnect(self, close_code):
        # Remove channel from per-user group
        user = self.scope.get("user")
        if user and getattr(user, "is_authenticated", False):
            try:
                async_to_sync(self.channel_layer.group_discard)(user.username, self.channel_name)
            except Exception:
                pass

    def receive(self, text_data):
        data = json.loads(text_data)
        source = data.get("source")

        # Debug print (useful while testing)
        print(f"[GroupChatConsumer] Received data: {data}")

        if source == "group.create":
            self.receive_group_create(data)
        elif source == "group.join":
            self.receive_group_join(data)
        elif source == "group.message.send":
            self.receive_group_message_send(data)
        elif source == "group.message.list":
            self.receive_group_message_list(data)
        elif source == "group.list":
            self.receive_group_list(data)
        else:
            # Unknown source - ignore or respond with error
            self.send(text_data=json.dumps({"error": f"Unknown source {source}"}))

    def receive_group_list(self, data):
        """
        Return a list of groups the current user belongs to.
        Sent shape: { "source": "group.list", "data": [ ...serialized groups... ] }
        """
        user = self.scope["user"]
        groups_qs = ChatGroup.objects.filter(groupmember__user=user).distinct()
        serialized = ChatGroupSerializer(groups_qs, many=True, context={"request": None}).data
        self.send(text_data=json.dumps({"source": "group.list", "data": serialized}))

    def receive_group_create(self, data):
        user = self.scope["user"]
        name = data.get("name")
        members_usernames = data.get("members", []) or []

        # ensure creator is included
        if user.username not in members_usernames:
            members_usernames.append(user.username)

        group = ChatGroup.objects.create(name=name, created_by=user)
        # Add members
        created_members = []
        for username in members_usernames:
            try:
                member = User.objects.get(username=username)
                GroupMember.objects.get_or_create(group=group, user=member)
                created_members.append(member)
            except User.DoesNotExist:
                continue

        serialized = ChatGroupSerializer(group, context={"request": None}).data

        # Send response back to the creator's socket
        self.send(text_data=json.dumps({"source": "group.create", "data": serialized}))

        # Notify each member (via their per-user group) about the new group
        for member in created_members:
            try:
                async_to_sync(self.channel_layer.group_send)(
                    member.username,
                    {"type": "broadcast_group", "source": "group.new", "data": serialized},
                )
            except Exception:
                # best-effort notify
                pass

    def receive_group_join(self, data):
        user = self.scope["user"]
        group_id = data.get("groupId")

        try:
            group = ChatGroup.objects.get(id=group_id)
        except ChatGroup.DoesNotExist:
            return self.send(text_data=json.dumps({"error": "Group not found"}))

        if not group.groupmember_set.filter(user=user).exists():
            return self.send(text_data=json.dumps({"error": "Not a member"}))

        async_to_sync(self.channel_layer.group_add)(f"group_{group.id}", self.channel_name)

        # Confirm join and include group id so frontend handlers can rely on parsed.data.groupId
        self.send(text_data=json.dumps({"source": "group.join", "data": {"status": "ok", "groupId": group.id}}))

    def receive_group_message_send(self, data):
        user = self.scope["user"]
        group_id = data.get("groupId")
        message_text = data.get("message")
        client_temp_id = data.get("clientTempId", None)

        try:
            group = ChatGroup.objects.get(id=group_id)
        except ChatGroup.DoesNotExist:
            return self.send(text_data=json.dumps({"error": "Group not found"}))

        if not group.groupmember_set.filter(user=user).exists():
            return self.send(text_data=json.dumps({"error": "Not a member"}))

        # Create message
        msg = GroupMessage.objects.create(user=user, group=group, text=message_text)
        serialized = GroupMessageSerializer(msg, context={"request": None}).data

        # Broadcast to channels that joined the group's room
        async_to_sync(self.channel_layer.group_send)(
            f"group_{group.id}",
            {"type": "broadcast_group", "source": "group.message.send", "data": serialized},
        )

        # Also notify all members via their per-user groups so they receive the message even if they haven't joined the room
        member_usernames = list(group.groupmember_set.values_list("user__username", flat=True))
        for username in member_usernames:
            try:
                async_to_sync(self.channel_layer.group_send)(
                    username,
                    {"type": "broadcast_group", "source": "group.message.send", "data": serialized},
                )
            except Exception:
                pass

    def receive_group_message_list(self, data):
        group_id = data.get("groupId")
        page = int(data.get("page", 0))
        page_size = 15

        try:
            group = ChatGroup.objects.get(id=group_id)
        except ChatGroup.DoesNotExist:
            return self.send(text_data=json.dumps({"error": "Group not found"}))

        messages_qs = group.messages.order_by("-created_at")[page * page_size:(page + 1) * page_size]
        serialized = GroupMessageSerializer(messages_qs, many=True, context={"request": None}).data

        next_page = page + 1 if group.messages.count() > (page + 1) * page_size else None
        self.send(text_data=json.dumps({
            "source": "group.message.list",
            "messages": serialized,
            "next": next_page
        }))

    # helper to send to a named channel group
    def send_group(self, group, source, data):
        async_to_sync(self.channel_layer.group_send)(
            group,
            {"type": "broadcast_group", "source": source, "data": data}
        )

    # handler invoked by group_send above
    def broadcast_group(self, event):
        # event already contains 'source' and 'data'
        event.pop("type", None)
        self.send(text_data=json.dumps(event))
