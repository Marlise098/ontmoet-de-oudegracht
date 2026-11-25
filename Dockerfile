FROM php:8.2-apache

# PHP-extensies: pdo_mysql (database) en gd (foto's verkleinen bij uploaden)
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpng-dev libjpeg62-turbo-dev libwebp-dev \
    && docker-php-ext-configure gd --with-jpeg --with-webp \
    && docker-php-ext-install pdo_mysql gd \
    && a2enmod headers \
    && rm -rf /var/lib/apt/lists/*

# Foto's tot 8 MB mogen worden geüpload
RUN { \
      echo 'upload_max_filesize = 10M'; \
      echo 'post_max_size = 12M'; \
      echo 'expose_php = Off'; \
    } > /usr/local/etc/php/conf.d/oudegracht.ini

WORKDIR /var/www/html

COPY . /var/www/html
COPY docker/000-default.conf /etc/apache2/sites-available/000-default.conf

RUN mkdir -p /var/www/html/src/public/uploads \
    && chown -R www-data:www-data /var/www/html/src/public/uploads

EXPOSE 80
