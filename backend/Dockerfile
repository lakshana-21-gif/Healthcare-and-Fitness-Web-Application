# FROM python:3.10-slim
# WORKDIR /app
# COPY . .
# RUN pip install -r requirements.txt
# CMD ["python", "main.py"]

FROM node:18
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 5000
CMD ["npm", "start"]
