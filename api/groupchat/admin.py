from django.contrib import admin
from .models import ChatGroup, GroupMember, GroupMessage

admin.site.register(ChatGroup)
admin.site.register(GroupMember)
admin.site.register(GroupMessage)
