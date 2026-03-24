web: python backend/manage.py migrate && gunicorn --chdir backend backend.wsgi:application --bind 0.0.0.0:$PORT --timeout 300 --workers 1 --threads 1 --worker-class gthread
