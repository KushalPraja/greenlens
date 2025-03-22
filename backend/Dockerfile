FROM python:3.12-slim

WORKDIR /app

# Copy requirements file
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Set environment variables
ENV NODE_ENV=development \
    PORT=5000 \
    MONGODB_URI=REDACTED
    JWT_SECRET=REDACTED
    CLIENT_URL=http://localhost:3000 \
    MONGODB_DB_NAME=greenlens \
    GEMINI_API_KEY=REDACTED
    UPLOAD_PATH=./uploads \
    UPLOAD_URL=http://localhost:5000/uploads \
    SECRET_KEY=REDACTED

# Expose port
EXPOSE 5000

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]