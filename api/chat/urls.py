from django.urls import path
from .views import SignInView, SignUpView, LangchainAPI, AskAPIView, ProfileAPIView

urlpatterns = [
    path('signin/', SignInView.as_view()),
    path('signup/', SignUpView.as_view()),
    path('api/langchain/', LangchainAPI.as_view(), name='langchain-api'),
    path('ask/', AskAPIView.as_view(), name='ask'),
    path('profile/', ProfileAPIView.as_view(), name='chat-profile'),
]