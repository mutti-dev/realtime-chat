import base64
import json
import io
import os
import uuid
import imghdr
from django.utils import timezone

from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
from django.core.files.base import ContentFile
from django.db.models import Q, Exists, OuterRef
from django.db.models.functions import Coalesce

from .models import User, Connection, Message, AiMessage

from .serializers import (
    UserSerializer,
    SearchSerializer,
    RequestSerializer,
    FriendSerializer,
    MessageSerializer,
)

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_community.llms import Ollama
import streamlit as st
from langchain_community.vectorstores import Chroma
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.chat_models import ChatOllama
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.prompts import PromptTemplate
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_retrieval_chain
import sys
from PIL import Image


class ChatConsumer(WebsocketConsumer):

    # New file / image limits (adjust as needed)
    MAX_THUMBNAIL_BYTES = 2 * 1024 * 1024      # 2 MB for profile thumbnails
    MAX_IMAGE_BYTES = 8 * 1024 * 1024          # 8 MB for chat images
    MAX_VIDEO_BYTES = 10 * 1024 * 1024         # 10 MB for video files
    MAX_IMAGE_WIDTH = 1280                     # max width to resize images to

    def connect(self):
        user = self.scope["user"]
        print(user, user.is_authenticated)

        if not user.is_authenticated:
            return
        # Save username to use as a group name for this user
        self.username = user.username
        # Join this user to a group with their username
        async_to_sync(self.channel_layer.group_add)(self.username, self.channel_name)
        self.accept()

        user.is_online = True
        user.save(update_fields=["is_online"])
        self.broadcast_user_status(user, True)

    def disconnect(self, close_code):
        user = self.scope["user"]
        # Leave room/group
        async_to_sync(self.channel_layer.group_discard)(
            self.username, self.channel_name
        )
        user.is_online = False
        user.last_online = timezone.now()
        user.save(update_fields=["is_online", "last_online"])
        self.broadcast_user_status(user, False)

    # -----------------------
    #    Handle requests
    # -----------------------

    def receive(self, text_data):
        # Receive message from websocket
        data = json.loads(text_data)
        data_source = data.get("source")

        # Pretty print  python dict
        print("receive", json.dumps(data, indent=2))

        # Get friend list
        if data_source == "friend.list":
            self.receive_friend_list(data)

        # Message List
        elif data_source == "message.list":
            self.receive_message_list(data)

        # Message has been sent
        elif data_source == "message.send":
            self.receive_message_send(data)

        # User is typing message
        elif data_source == "message.type":
            self.receive_message_type(data)

        # Accept friend request
        elif data_source == "request.accept":
            self.receive_request_accept(data)

        # Make friend request
        elif data_source == "request.connect":
            self.receive_request_connect(data)

        # Get request list
        elif data_source == "request.list":
            self.receive_request_list(data)

        # Search / filter users
        elif data_source == "search":
            self.receive_search(data)

        # Thumbnail upload
        elif data_source == "thumbnail":
            self.receive_thumbnail(data)

        elif data_source == "file":
            self.receive_file(data)

        elif data_source == "ai.query":
            self.receive_ai_query(data)

        # new: user profile/settings update
        elif data_source == "user.update":
            self.receive_user_update(data)

    def process_ai_query(self, question):
        try:
            # Initialize Langchain components
            prompt = ChatPromptTemplate.from_messages(
                [
                    (
                        "system",
                        "You are a anngry assistant.Your name is Mutti. Respond to user queries.",
                    ),
                    ("user", f"Question: {question}"),
                ]
            )
            llm = Ollama(model="llama3.2")
            output_parser = StrOutputParser()
            # Load vector store
            # embedding = FastEmbedEmbeddings()
            # vector_store = Chroma(persist_directory="./sql_chroma_db", embedding_function=embedding)
            # Build the chain
            chain = prompt | llm | output_parser

            # Generate a response
            response = chain.invoke({"question": question})
            print("Response", response)
            user = self.scope["user"]
            AiMessage.objects.create(
                user=user,  # Assign the user who triggered the query
                ai_res=response,  # Save the AI-generated text
                user_query=question,  # Mark the message as AI-generated
            )
            return response
        except Exception as e:
            print(f"Error processing AI query: {e}")
            return "I'm sorry, there was an error with the AI agent."

    def rag_chain(self):
        # Use the ChatOllama model
        model = ChatOllama(model="llama3.2")

        # Define the prompt template
        prompt = PromptTemplate.from_template(
            """
			<s> [Instructions] You are a friendly assistant. Answer the question based only on the following context. 
			If you don't know the answer, then reply, No Context available for this question {input}. [/Instructions] </s> 
			[Instructions] Question: {input} 
			Context: {context} 
			Answer: [/Instructions]
			"""
        )

        # Load the vector store (Chroma) for document retrieval
        embedding = FastEmbedEmbeddings()
        vector_store = Chroma(
            persist_directory="./sql_chroma_db", embedding_function=embedding
        )

        # Create the retriever for similarity-based search
        retriever = vector_store.as_retriever(
            search_type="similarity_score_threshold",
            search_kwargs={
                "k": 3,
                "score_threshold": 0.5,
            },
        )

        # Create a document chain that generates answers based on retrieved context
        document_chain = create_stuff_documents_chain(model, prompt)

        # Create the final retrieval chain that combines the retriever and the document chain
        chain = create_retrieval_chain(retriever, document_chain)

        return chain

    def receive_friend_list(self, data):
        user = self.scope["user"]
        # Latest message subquery
        latest_message = Message.objects.filter(connection=OuterRef("id")).order_by(
            "-created"
        )[:1]
        # Get connections for user
        connections = (
            Connection.objects.filter(Q(sender=user) | Q(receiver=user), accepted=True)
            .annotate(
                latest_text=latest_message.values("text"),
                latest_created=latest_message.values("created"),
            )
            .order_by(Coalesce("latest_created", "updated").desc())
        )
        serialized = FriendSerializer(connections, context={"user": user}, many=True)
        # Send data back to requesting user
        self.send_group(user.username, "friend.list", serialized.data)

    def receive_ai_query(self, data):
        user = self.scope["user"]
        question = data.get("message")

        if not question:
            print("Error: No question provided for AI agent here.")
            return

            # Process the AI response
        ai_response = self.process_ai_query(question)

        # Broadcast AI response back to the group
        response_data = {
            "username": "AI Agent",  # Static AI agent identity
            "message": ai_response,
        }
        self.send_group(user.username, "ai.response", response_data)

    def receive_message_list(self, data):
        user = self.scope["user"]
        connectionId = data.get("connectionId")
        page = data.get("page")
        page_size = 15
        try:
            connection = Connection.objects.get(id=connectionId)
        except Connection.DoesNotExist:
            print("Error: couldnt find connection")
            return
        # Get messages
        messages = Message.objects.filter(connection=connection).order_by("-created")[
            page * page_size : (page + 1) * page_size
        ]
        # Serialized message
        serialized_messages = MessageSerializer(
            messages, context={"user": user}, many=True
        )
        # Get recipient friend
        recipient = connection.sender
        if connection.sender == user:
            recipient = connection.receiver

        # Serialize friend
        serialized_friend = UserSerializer(recipient)

        # Count the total number of messages for this connection
        messages_count = Message.objects.filter(connection=connection).count()

        next_page = page + 1 if messages_count > (page + 1) * page_size else None

        data = {
            "messages": serialized_messages.data,
            "next": next_page,
            "friend": serialized_friend.data,
        }
        # Send back to the requestor
        self.send_group(user.username, "message.list", data)

    def receive_message_send(self, data):
        user = self.scope["user"]
        connectionId = data.get("connectionId")
        message_text = data.get("message")
        # client-provided temporary id (optional)
        client_temp_id = data.get("clientTempId")
        # file_data may be in different shapes
        file_data = message_text.get("file") if isinstance(message_text, dict) else None

        # debug log
        # ...existing debug file write removed for production ...
        try:
            connection = Connection.objects.get(id=connectionId)
        except Connection.DoesNotExist:
            print("Error: couldn't find connection")
            return

        # If file payload present, handle similarly to receive_file
        if file_data:
            filename, raw_bytes, mime_hint = self._decode_base64_field(file_data)
            if raw_bytes:
                # try image detection
                is_image = False
                try:
                    img_type = imghdr.what(None, raw_bytes)
                    if img_type:
                        is_image = True
                except Exception:
                    is_image = False

                if is_image:
                    if len(raw_bytes) > self.MAX_IMAGE_BYTES:
                        print("Image too large, rejecting")
                        return
                    processed = self._process_image_bytes(raw_bytes, max_width=self.MAX_IMAGE_WIDTH, quality=80)
                    if not processed:
                        return
                    safe_name = self._safe_filename(filename)
                    file_content = ContentFile(processed, name=safe_name)
                else:
                    if len(raw_bytes) > self.MAX_VIDEO_BYTES:
                        print("File too large, rejecting")
                        return
                    safe_name = self._safe_filename(filename)
                    file_content = ContentFile(raw_bytes, name=safe_name)

                message = Message.objects.create(connection=connection, user=user, file=file_content)
            else:
                # plain text or invalid file_data: save as text
                message = Message.objects.create(connection=connection, user=user, text=message_text if isinstance(message_text, str) else '')
        else:
            # Save text only
            message = Message.objects.create(connection=connection, user=user, text=message_text if isinstance(message_text, str) else '')

        # Get recipient friend
        recipient = (
            connection.sender if connection.sender != user else connection.receiver
        )

        # Send new message back to sender
        serialized_message = MessageSerializer(message, context={"user": user})
        serialized_friend = UserSerializer(recipient)
        # include clientTempId so clients reconcile optimistic messages
        data = {"message": serialized_message.data, "friend": serialized_friend.data}
        if client_temp_id:
            data["clientTempId"] = client_temp_id
        self.send_group(user.username, "message.send", data)

        # Send new message to receiver
        serialized_message = MessageSerializer(message, context={"user": recipient})
        serialized_friend = UserSerializer(user)
        data = {"message": serialized_message.data, "friend": serialized_friend.data}
        if client_temp_id:
            data["clientTempId"] = client_temp_id
        self.send_group(recipient.username, "message.send", data)

    def receive_message_type(self, data):
        user = self.scope["user"]
        recipient_username = data.get("username")
        data = {"username": user.username}
        self.send_group(recipient_username, "message.type", data)

    def receive_request_accept(self, data):
        username = data.get("username")
        # Fetch connection object
        try:
            connection = Connection.objects.get(
                sender__username=username, receiver=self.scope["user"]
            )
        except Connection.DoesNotExist:
            print("Error: connection  doesnt exists")
            return
        # Update the connection
        connection.accepted = True
        connection.save()

        serialized = RequestSerializer(connection)
        # Send accepted request to sender
        self.send_group(connection.sender.username, "request.accept", serialized.data)
        # Send accepted request to receiver
        self.send_group(connection.receiver.username, "request.accept", serialized.data)

        # Send new friend object to sender
        serialized_friend = FriendSerializer(
            connection, context={"user": connection.sender}
        )
        self.send_group(
            connection.sender.username, "friend.new", serialized_friend.data
        )

        # Send new friend object to receiver
        serialized_friend = FriendSerializer(
            connection, context={"user": connection.receiver}
        )
        self.send_group(
            connection.receiver.username, "friend.new", serialized_friend.data
        )

    def receive_request_connect(self, data):
        username = data.get("username")
        # Attempt to fetch the receiving user
        try:
            receiver = User.objects.get(username=username)
        except User.DoesNotExist:
            print("Error: User not found")
            return
        # Create connection
        connection, _ = Connection.objects.get_or_create(
            sender=self.scope["user"], receiver=receiver
        )
        # Serialized connection
        serialized = RequestSerializer(connection)
        # Send back to sender
        self.send_group(connection.sender.username, "request.connect", serialized.data)
        # Send to receiver
        self.send_group(
            connection.receiver.username, "request.connect", serialized.data
        )

    def receive_request_list(self, data):
        user = self.scope["user"]
        # Get connection made to this  user
        connections = Connection.objects.filter(receiver=user, accepted=False)
        serialized = RequestSerializer(connections, many=True)
        # Send requests lit back to this userr
        self.send_group(user.username, "request.list", serialized.data)

    def receive_search(self, data):
        query = data.get("query")
        # Get users from query search term
        users = (
            User.objects.filter(
                Q(username__istartswith=query)
                | Q(first_name__istartswith=query)
                | Q(last_name__istartswith=query)
            )
            .exclude(username=self.username)
            .annotate(
                pending_them=Exists(
                    Connection.objects.filter(
                        sender=self.scope["user"],
                        receiver=OuterRef("id"),
                        accepted=False,
                    )
                ),
                pending_me=Exists(
                    Connection.objects.filter(
                        sender=OuterRef("id"),
                        receiver=self.scope["user"],
                        accepted=False,
                    )
                ),
                connected=Exists(
                    Connection.objects.filter(
                        Q(sender=self.scope["user"], receiver=OuterRef("id"))
                        | Q(receiver=self.scope["user"], sender=OuterRef("id")),
                        accepted=True,
                    )
                ),
            )
        )
        # serialize results
        serialized = SearchSerializer(users, many=True)
        # Send search results back to this user
        self.send_group(self.username, "search", serialized.data)

    def _safe_filename(self, original):
        name = os.path.basename(original or '')
        if not name:
            name = str(uuid.uuid4())
        # ensure extension present
        base, ext = os.path.splitext(name)
        if not ext:
            ext = '.jpg'
        return f"{uuid.uuid4().hex}{ext}"

    def _process_image_bytes(self, image_bytes, max_width=None, quality=85):
        """
        Open image from bytes, resize if wider than max_width and re-encode as JPEG.
        Return bytes.
        """
        try:
            with Image.open(io.BytesIO(image_bytes)) as img:
                img_format = 'JPEG'
                # Convert PNG/transparency to RGB background for JPEG
                if img.mode in ("RGBA", "P"):
                    bg = Image.new("RGB", img.size, (255, 255, 255))
                    bg.paste(img, mask=img.split()[3] if img.mode == "RGBA" else None)
                    img = bg
                if max_width and img.width > max_width:
                    wpercent = (max_width / float(img.width))
                    hsize = int((float(img.height) * float(wpercent)))
                    img = img.resize((max_width, hsize), Image.LANCZOS)
                out = io.BytesIO()
                img.save(out, format=img_format, quality=quality, optimize=True)
                return out.getvalue()
        except Exception as e:
            print("Image processing failed:", e)
            return None

    def _decode_base64_field(self, data_dict):
        """
        Accepts different payload shapes. Returns tuple (filename, bytes, mime_hint)
        """
        if not data_dict:
            return (None, None, None)
        # support both 'base64' and 'data' keys (client earlier used 'data' for base64)
        b64 = data_dict.get('base64') or data_dict.get('data')
        if not b64:
            return (data_dict.get('name') or data_dict.get('filename'), None, None)
        # strip data URI prefix if present
        if isinstance(b64, str) and b64.startswith('data:'):
            try:
                header, b64 = b64.split(',', 1)
            except Exception:
                pass
        try:
            raw = base64.b64decode(b64)
        except Exception as e:
            print("Base64 decode error:", e)
            return (data_dict.get('name') or data_dict.get('filename'), None, None)
        filename = data_dict.get('name') or data_dict.get('filename') or f"{uuid.uuid4().hex}"
        mime_hint = data_dict.get('type') or None
        return (filename, raw, mime_hint)

    def receive_thumbnail(self, data):
        user = self.scope["user"]
        # Normalize incoming payload
        filename, raw_bytes, mime_hint = self._decode_base64_field(data)
        if raw_bytes is None:
            print("No thumbnail data received")

        # process / resize image
        processed = self._process_image_bytes(raw_bytes, max_width=512, quality=80)
        if processed is None:
            print("Failed processing thumbnail")
            return

        safe_name = self._safe_filename(filename)
        content = ContentFile(processed, name=safe_name)
        user.thumbnail.save(safe_name, content, save=True)

        serialized = UserSerializer(user)
        self.send_group(self.username, "thumbnail", serialized.data)


        

    def receive_file(self, data):  # generic file upload via socket (keep but validate)
        user = self.scope["user"]
        connection_id = data.get("connectionId")
        filename, raw_bytes, mime_hint = self._decode_base64_field(data)
        if raw_bytes is None:
            print("No file bytes found")
            return

        # validate connection
        try:
            connection = Connection.objects.get(id=connection_id)
        except Connection.DoesNotExist:
            print("Error: Connection not found")
            return

        # determine file type
        # try image magic
        ext = os.path.splitext(filename)[1].lower()
        is_image = False
        try:
            img_type = imghdr.what(None, raw_bytes)
            if img_type:
                is_image = True
        except Exception:
            is_image = False

        if is_image:
            if len(raw_bytes) > self.MAX_IMAGE_BYTES:
                print("Image too large, rejecting")
                return
            processed = self._process_image_bytes(raw_bytes, max_width=self.MAX_IMAGE_WIDTH, quality=80)
            if processed is None:
                print("Failed processing image")
                return
            safe_name = self._safe_filename(filename)
            file_obj = ContentFile(processed, name=safe_name)
        else:
            # treat as generic file / video - enforce size limit
            if len(raw_bytes) > self.MAX_VIDEO_BYTES:
                print("File too large, rejecting")
                return
            safe_name = self._safe_filename(filename)
            file_obj = ContentFile(raw_bytes, name=safe_name)

        # Save the message with the file
        try:
            message = Message.objects.create(connection=connection, user=user, file=file_obj)
        except Exception as e:
            print("Error saving message with file:", e)
            return

        # notify sender
        serialized_message = MessageSerializer(message, context={"user": user})
        self.send_group(user.username, "message.send", serialized_message.data)

        # notify recipient
        recipient = connection.sender if connection.sender != user else connection.receiver
        serialized_message = MessageSerializer(message, context={"user": recipient})
        self.send_group(recipient.username, "message.send", serialized_message.data)

    # helper to send a group event via channel layer
    def send_group(self, group, source, data):
        response = {"type": "broadcast_group", "source": source, "data": data}
        async_to_sync(self.channel_layer.group_send)(group, response)

    # Channels handler invoked when a group_send with type 'broadcast_group' is received
    def broadcast_group(self, event):
        # event is the dict passed to group_send; remove type and forward to websocket
        event.pop("type", None)
        try:
            self.send(text_data=json.dumps(event))
        except Exception as e:
            print("Error sending group event to client:", e)

    # Broadcast a user's online status to all accepted friends
    def broadcast_user_status(self, user, is_online):
        status_data = {
            "username": user.username,
            "is_online": is_online,
            "last_online": user.last_online.isoformat() if user.last_online else None,
        }
        # Get all accepted connections
        friends = Connection.objects.filter(
            Q(sender=user, accepted=True) | Q(receiver=user, accepted=True)
        )
        for conn in friends:
            friend = conn.receiver if conn.sender == user else conn.sender
            # send user.status event to each friend
            self.send_group(
                friend.username,
                "user.status",
                {
                    "username": user.username,
                    "is_online": is_online,
                    "last_online": status_data["last_online"],
                },
            )

    def receive_user_update(self, data):
        """
        Expected data:
          { source: 'user.update', user: { name, password, ... } }
          or { source: 'user.update', settings: { theme, notifications } }
        This updates the authenticated user's fields where supported and
        returns the serialized updated user to the requester and their friends.
        """
        user = self.scope["user"]
        payload = data.get("user") or data.get("data") or {}
        settings = data.get("settings") or {}

        updated = False

        # Update basic name/display
        new_name = payload.get("name")
        if new_name is not None and getattr(user, "name", None) != new_name:
            try:
                user.name = new_name
                updated = True
            except Exception as e:
                print("Error setting name:", e)

        # Update password (use set_password)
        new_password = payload.get("password")
        if new_password:
            try:
                user.set_password(new_password)
                updated = True
            except Exception as e:
                print("Error setting password:", e)

        # Apply settings object (theme/notifications) if model supports properties or a settings JSON field
        if settings:
            # Try known attributes if present
            if "theme" in settings and hasattr(user, "theme"):
                try:
                    user.theme = settings.get("theme")
                    updated = True
                except Exception as e:
                    print("Error setting theme:", e)
            if "notifications" in settings and hasattr(user, "notifications_enabled"):
                try:
                    user.notifications_enabled = bool(settings.get("notifications"))
                    updated = True
                except Exception as e:
                    print("Error setting notifications:", e)
            # Attempt to merge into a JSONField named 'settings' if present
            if hasattr(user, "settings"):
                try:
                    current = user.settings or {}
                    merged = {**current, **settings}
                    user.settings = merged
                    updated = True
                except Exception as e:
                    print("Error merging settings:", e)

        if updated:
            try:
                user.save()
            except Exception as e:
                print("Error saving updated user:", e)
                # still attempt to serialize current user state

        # Serialize and send updated user back to requester
        serialized = UserSerializer(user)
        self.send_group(user.username, "user.update", serialized.data)

        # Also notify all accepted friends about the user's updated profile
        try:
            friends = Connection.objects.filter(
                Q(sender=user, accepted=True) | Q(receiver=user, accepted=True)
            )
            for conn in friends:
                friend = conn.receiver if conn.sender == user else conn.sender
                self.send_group(friend.username, "user.update", serialized.data)
        except Exception as e:
            print("Error broadcasting user update to friends:", e)
