# Documentation déploiement site web

Le site web à été réalisé avec la tehnologie NodeJS et express. Il est disponible à l'adresse suivante : https://stephan-server-xl.duckdns.org:3333.

- [Documentation déploiement site web](#documentation-déploiement-site-web)
  - [Besoins](#besoins)
    - [NodeJS](#nodejs)
      - [Installation de NodeJS sur windows](#installation-de-nodejs-sur-windows)
      - [Installation de NodeJS sur Linux](#installation-de-nodejs-sur-linux)
  - [Installer le projet](#installer-le-projet)
  - [Installer SQLite](#installer-sqlite)
    - [Installation sur windows](#installation-sur-windows)
    - [Installaton sur Linux](#installaton-sur-linux)
  - [Configuration de l'application](#configuration-de-lapplication)
  - [Lancer le projet](#lancer-le-projet)

## Besoins

Pour héberger le site web sur vos propres serveurs, vous aurez besoin d'avoir NodeJS installé, ainsi qu'un gestionnaire de paquets comme npm ou yarn. Nous vous conseillons également d'installer un gestionnaire de processus pour NodeJS comme PM2.

### NodeJS
#### Installation de NodeJS sur windows

  Rendez-vous sur le [site web officiel de NodeJS](https://nodejs.org/) et téléchargez l'installeur.
  Npm est automatiquement installé en même temps que NodeJS. Pour utiliser yarn, [rendez-vous ici](https://yarnpkg.com/)

#### Installation de NodeJS sur Linux

  Vous pouvez facilement installer NodeJS et npm avec apt-install :

      $ sudo apt install nodejs
      $ sudo apt install npm

Si tout s'est bien passé, vous devriez pouvoir exécuter la commande suivante :

    $ node --version
    v8.11.3

    $ npm --version
    6.1.0


## Installer le projet

Pour installer le projet sur votre serveur, procéder comme cela :

    $ git clone https://github.com/MiniJez/MSPR_reseaux.git
    $ cd App
    $ npm install
    $ cd ..
    $ cd mailService
    $ npm install

Ces lignes de commandes vont installer les deux services nécessaires pour le bon fonctionnement du projet : 
- Le service App, qui est l'application web.
- Le service mailService, qui gère l'envoi des mails.

## Installer SQLite

L'application web utilise sqlite comme base de données. Pour installer sqlite, procéder comme cela :

### Installation sur windows

    - Télécharger les binaires précompilés pour windows à l'adresse suivante : https://www.sqlite.org/download.html
    - Dézipper les fichiers dans C:/sqlite
    - Ajouter le chemin C:/sqlite a votre PATH
    
    Vous pouvez ensuite vérifier l'installation de sqlite :
    ```
    $ C:\>sqlite3   
    $ SQLite version 3.7.15.2 2013-01-09 11:53:05   
    $ Enter ".help" for instructions    
    $ Enter SQL statements terminated with a ";"    
    $ sqlite>   
    ```

### Installaton sur Linux

    - Installer sqlite 
    ```
    $ sudo apt-get install sqlite3
    ```
    - Vérifier l'installation :
    ```
    $ sqlite3
    SQLite version 3.8.2 2013-12-06 14:53:30
    Enter ".help" for instructions
    Enter SQL statements terminated with a ";"
    ```

## Configuration de l'application

Ouvrez le dossier App.

- Créer un fichier *database.db3* à la racine du dossier App.
- Ouvrez un terminal, puis entrez les commandes suivantes :
```
$ sqlite3 database.db3
$ CREATE TABLE browsers(login TEXT, navigator TEXT);
$ CREATE TABLE ipInfo(login TEXT, ip TEXT, country TEXT);
$ CREATE TABLE pwndStatus(login TEXT, data TEXT);
```

- Ouvrez le dossier mailService
- Créer un fichier *.env* puis saisissez les informations suivantes :
    - EMAIL_SEND: *votre_adresse_email_ici*
    - EMAIL_PASS: *le_mdp_de_votre_email_ici*

## Lancer le projet

Pour lancer le projet, rendez-vous dans le dossier App, puis saisissez :

    $ npm start

Enfin répétez l'opération dans le dossier *mailService*

*Note : nous vous conseillons d'utiliser PM2 pour gérer vos applications NodeJS : https://pm2.keymetrics.io/docs/usage/quick-start/*

Votre application est accessible à https://localhost:3333.

Le service de mail utilise le port 3334.
