FROM php:8.2-apache

WORKDIR /var/www/html

COPY . /var/www/html
COPY docker/000-default.conf /etc/apache2/sites-available/000-default.conf

EXPOSE 80
