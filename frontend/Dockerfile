FROM node:20-alpine

WORKDIR /app

COPY package*.json tsconfig*.json vite.config.ts tailwind.config.js postcss.config.js index.html ./
RUN npm install

COPY src/ ./src/

EXPOSE 3000

CMD ["npm", "run", "dev"]
