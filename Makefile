run: run-android run-ios

run-android:
	cd app && npm run android

run-ios:
	cd app && npm run ios -- --simulator='iPhone 14 Pro Max'

server:
	. .venv/bin/activate && cd api && python manage.py runserver

# New helper targets ---------------------------------------------------------
migrate:
	. .venv/bin/activate && cd api && python manage.py migrate

collectstatic:
	. .venv/bin/activate && cd api && python manage.py collectstatic --noinput

install:
	. .venv/bin/activate && pip install -r requirements.txt

docker-build:
	docker build -t realtime-chat .

docker-up:
	docker compose up

redis:
	redis-server