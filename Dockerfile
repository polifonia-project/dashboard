FROM python:3.11.9-alpine

WORKDIR /app

COPY requirements.txt requirements.txt
# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
# Set environment variables to configure Flask
ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0
ENV FLASK_ENV=development  

# Expose the port your Flask app runs on
EXPOSE 5000

CMD ["flask", "run"]
