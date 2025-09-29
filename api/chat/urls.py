from django.urls import path
from .views import SignInView, SignUpView, ProfileAPIView, MessageUploadView

urlpatterns = [
    path('signin/', SignInView.as_view()),
    path('signup/', SignUpView.as_view()),
    path('profile/', ProfileAPIView.as_view(), name='chat-profile'),
    path("upload/", MessageUploadView.as_view(), name="message-upload"),
]