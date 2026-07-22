FROM node:20-alpine

# Create a non-root user and group
RUN addgroup app && adduser -S app -G app

# Set the user to run the app
USER app

WORKDIR /app

COPY package.json .

# Sometimes the owner of the files is root, and the app cannot access the files,so we need to change the owner to the app user
USER root

RUN chown -R app:app /app

# Now after changing the owner, we need to set the user back to the app user
USER app

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]