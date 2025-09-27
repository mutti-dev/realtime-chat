.PHONY: app api ngrok

# Run Expo app
app:
	cd app && npx expo start -c

# Run Django server
api:
	cd api && python manage.py runserver

# Run Ngrok
ngrok:
	ngrok http --domain=equal-useful-buck.ngrok-free.app 8000
