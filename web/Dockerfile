# ==========================================
# 1. Build Stage
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# 依存関係のインストール（キャッシュ活用）
COPY package*.json ./
RUN npm ci

# ソースコードのコピーとビルド
COPY . .
# 実際の環境変数はビルド時に渡すか、実行時に解決されるようにする
RUN npm run build

# ==========================================
# 2. Production Stage (Nginx)
# ==========================================
FROM nginx:alpine

# Nginxのデフォルト設定を削除し、セキュアな設定を配置
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# ビルド成果物をNginxの公開ディレクトリにコピー
COPY --from=builder /app/dist /usr/share/nginx/html

# nginxユーザー権限で実行（root実行を避ける）
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
