from django.contrib.auth import authenticate
from django.shortcuts import render
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import UserSerializer, SignUpSerializer
from rest_framework import status
from langchain_community.llms import Ollama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_community.chat_models import ChatOllama
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from langchain.prompts import PromptTemplate
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_retrieval_chain
from langchain.vectorstores import Chroma

def get_auth_for_user(user):
	tokens = RefreshToken.for_user(user)
	return {
		'user': UserSerializer(user).data,
		'tokens': {
			'access': str(tokens.access_token),
			'refresh': str(tokens),
		}
	}


class SignInView(APIView):
	permission_classes = [AllowAny]

	def post(self, request):
		username = request.data.get('username')
		password = request.data.get('password')
		if not username or not password:
			return Response(status=400)
		
		user = authenticate(username=username, password=password)
		if not user:
			return Response(status=401)

		user_data = get_auth_for_user(user)

		return Response(user_data)


class SignUpView(APIView):
	permission_classes = [AllowAny]

	def post(self, request):
		new_user = SignUpSerializer(data=request.data)
		new_user.is_valid(raise_exception=True)
		user = new_user.save()

		user_data = get_auth_for_user(user)

		return Response(user_data)
	


class LangchainAPI(APIView):
    def post(self, request):
        # Get the input query from the request body
        input_text = request.data.get("question")
        
        if not input_text:
            return Response({"error": "No question provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Langchain Prompt Template and Model
        prompt = ChatPromptTemplate.from_messages(
            [
                ("system", "You are a helpful assistant. Please respond to the user queries"),
                ("user", "Question:{question}")
            ]
        )

        llm = Ollama(model="llama3.2")
        output_parser = StrOutputParser()
        chain = prompt | llm | output_parser
        
        # Generate the response using Langchain
        response = chain.invoke({"question": input_text})
        
        return Response({"answer": response}, status=status.HTTP_200_OK)



class AskAPIView(APIView):
    def post(self, request):
        query = request.data.get('query', '')
        if not query:
            return Response({'error': 'Query parameter is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Define the RAG chain
            def rag_chain():
                model = ChatOllama(model="llama3.2")
                prompt = PromptTemplate.from_template(
                    """
                    <s> [Instructions] You are a friendly assistant. Answer the question based only on the following context. 
                    If you don't know the answer, then reply, No Context available for this question {input}. [/Instructions] </s> 
                    [Instructions] Question: {input} 
                    Context: {context} 
                    Answer: [/Instructions]
                    """
                )
                embedding = FastEmbedEmbeddings()
                vector_store = Chroma(
                    persist_directory="./sql_chroma_db",
                    embedding_function=embedding
                )
                retriever = vector_store.as_retriever(
                    search_type="similarity_score_threshold",
                    search_kwargs={
                        "k": 3,
                        "score_threshold": 0.5,
                    },
                )
                document_chain = create_stuff_documents_chain(model, prompt)
                chain = create_retrieval_chain(retriever, document_chain)
                return chain

            # Execute the chain
            chain = rag_chain()
            result = chain.invoke({"input": query})
            answer = result["answer"]
            sources = [
                {"source": doc.metadata["source"]} for doc in result["context"]
            ]

            return Response({"answer": answer, "sources": sources}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
