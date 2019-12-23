FROM ruby:2.5.1

RUN apt-get update && apt-get install -y mysql-client pdftk

RUN wget -O /tmp/wait-for-it.sh https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh
RUN chmod +x /tmp/wait-for-it.sh

ENV BUNDLER_VERSION=2.0.1
RUN gem install bundler -v "2.0.1" --no-document

WORKDIR /api

COPY Gemfile* ./
COPY . /api

EXPOSE 3000
CMD ["bin/rails", "server", "-p", "8000", "-b", "0.0.0.0"]
