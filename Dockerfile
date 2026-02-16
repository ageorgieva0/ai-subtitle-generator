# Use a Python base image
FROM python:3.10-slim

# Install FFmpeg and system tools
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Set up a working directory
WORKDIR /app

# Create a non-root user (Hugging Face requirement)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Create a folder for uploads that the 'user' can write to
RUN mkdir -p /home/user/app/uploads
WORKDIR /home/user/app

# Copy and install requirements
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your code
COPY --chown=user . .

# Run the app on port 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]