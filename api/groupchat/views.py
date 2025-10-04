from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from chat.models import User
from .models import GroupMember, ChatGroup
from .serializers import ChatGroupSerializer
from rest_framework import viewsets, permissions


class ChatGroupViewSet(viewsets.ModelViewSet):
    queryset = ChatGroup.objects.all()
    serializer_class = ChatGroupSerializer
    permission_classes = [permissions.IsAuthenticated]


    def perform_create(self, serializer):
        group = serializer.save(created_by=self.request.user)

        # Add creator as member
        GroupMember.objects.create(group=group, user=self.request.user)

        # Add members from request
        members = self.request.data.get("members", [])
        if isinstance(members, str):
            members = [m.strip() for m in members.split(",") if m.strip()]

        for username in members:
            try:
                user = User.objects.get(username=username)
                GroupMember.objects.get_or_create(group=group, user=user)
            except User.DoesNotExist:
                continue

        return group

    @action(detail=True, methods=["post"])
    def add_members(self, request, pk=None):
        group = self.get_object()
        members = request.data.get("members", [])

        added = []
        for username in members:
            try:
                user = User.objects.get(username=username)
                GroupMember.objects.get_or_create(group=group, user=user)
                added.append(username)
            except User.DoesNotExist:
                continue

        return Response({"status": "members added", "members": added}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=["post"])
    def remove_members(self, request, pk=None):
        group = self.get_object()
        members = request.data.get("members", [])

        removed = []
        for username in members:
            try:
                user = User.objects.get(username=username)
                GroupMember.objects.filter(group=group, user=user).delete()
                removed.append(username)
            except User.DoesNotExist:
                continue

        return Response({"status": "members removed", "members": removed}, status=status.HTTP_200_OK)

