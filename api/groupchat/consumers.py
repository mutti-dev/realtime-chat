import json
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
from .models import ChatGroup, GroupMember, GroupMessage
from .serializers import GroupMessageSerializer, ChatGroupSerializer

class GroupChatConsumer(WebsocketConsumer):

    def connect(self):
        user = self.scope["user"]
        if not user.is_authenticated:
            return
        self.accept()

    def disconnect(self, close_code):
        pass

    def receive(self, text_data):
        data = json.loads(text_data)
        source = data.get("source")

        print(f"Received data: {data}")

        if source == "group.create":
            self.receive_group_create(data)
        elif source == "group.join":
            self.receive_group_join(data)
        elif source == "group.message.send":
            self.receive_group_message_send(data)
        elif source == "group.message.list":
            self.receive_group_message_list(data)

    def receive_group_create(self, data):
        user = self.scope["user"]
        name = data.get("name")
        members_usernames = data.get("members", [])

        group = ChatGroup.objects.create(name=name, created_by=user)
        GroupMember.objects.create(group=group, user=user)

        from chat.models import User
        for username in members_usernames:
            try:
                member = User.objects.get(username=username)
                GroupMember.objects.get_or_create(group=group, user=member)
            except User.DoesNotExist:
                continue

        serialized = ChatGroupSerializer(group).data
        self.send(text_data=json.dumps({"source": "group.create", "data": serialized}))

        for member in group.members.all():
            self.send_group(member.username, "group.new", serialized)

    def receive_group_join(self, data):
        user = self.scope["user"]
        group_id = data.get("groupId")

        try:
            group = ChatGroup.objects.get(id=group_id)
        except ChatGroup.DoesNotExist:
            return self.send(text_data=json.dumps({"error": "Group not found"}))

        if not group.members.filter(id=user.id).exists():
            return self.send(text_data=json.dumps({"error": "Not a member"}))

        async_to_sync(self.channel_layer.group_add)(f"group_{group.id}", self.channel_name)
        self.send(text_data=json.dumps({"source": "group.join", "status": "ok"}))

    def receive_group_message_send(self, data):
        user = self.scope["user"]
        group_id = data.get("groupId")
        message_text = data.get("message")

        try:
            group = ChatGroup.objects.get(id=group_id)
        except ChatGroup.DoesNotExist:
            return self.send(text_data=json.dumps({"error": "Group not found"}))

        if not group.members.filter(id=user.id).exists():
            return self.send(text_data=json.dumps({"error": "Not a member"}))

        msg = GroupMessage.objects.create(user=user, group=group, text=message_text)
        serialized = GroupMessageSerializer(msg).data

        async_to_sync(self.channel_layer.group_send)(
            f"group_{group.id}",
            {"type": "broadcast_group", "source": "group.message.send", "data": serialized},
        )

    def receive_group_message_list(self, data):
        group_id = data.get("groupId")
        page = data.get("page", 0)
        page_size = 15

        try:
            group = ChatGroup.objects.get(id=group_id)
        except ChatGroup.DoesNotExist:
            return self.send(text_data=json.dumps({"error": "Group not found"}))

        messages = group.messages.order_by("-created_at")[page*page_size:(page+1)*page_size]
        serialized = GroupMessageSerializer(messages, many=True).data

        self.send(text_data=json.dumps({
            "source": "group.message.list",
            "messages": serialized,
            "next": page+1 if group.messages.count() > (page+1)*page_size else None
        }))

    def send_group(self, group, source, data):
        async_to_sync(self.channel_layer.group_send)(
            group,
            {"type": "broadcast_group", "source": source, "data": data}
        )

    def broadcast_group(self, event):
        event.pop("type", None)
        self.send(text_data=json.dumps(event))
