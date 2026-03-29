FROM node:20-bookworm-slim

WORKDIR /app/apps/chatgpt

COPY apps/chatgpt/package.json apps/chatgpt/package-lock.json ./
RUN npm ci

COPY apps/chatgpt /app/apps/chatgpt
COPY packages /app/packages
RUN npm run build

ENV PORT=8788
EXPOSE 8788

CMD ["npm", "run", "start"]
