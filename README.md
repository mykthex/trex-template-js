# T-REX JS Npm & Twig & Gulp template
Base template running on NPM and Gulp with live reloading et bundling. Using SASS, JS Minifier and TWIG. All the JS code is separated in modules using a jQuery plugin boilerplate.

## Usage

1. Clone the repository on a folder on your computer

	```
    git clone URL
	```

2. Run npm install on in that same folder

	```
	npm install
	```

3. Run gulp and start working!

	```
    gulp
	```

    NOTE: Si vous n'avez pas installer gulp globallement encore vous devez le faire avant d'exécuter gulp:

    ```
    npm install -g gulp
    ```

4. Go on the browser sync link to see live what you are doing

    ```
    [Browsersync] Access URLs:
     ------------------------------------
           Local: http://localhost:3000
        External: http://1.197.94.13:3000
     ------------------------------------
              UI: http://localhost:3001
     UI External: http://1.197.94.13:3001
     ------------------------------------
    [Browsersync] Serving files from: dist
    ```

## Infos

The static site is automatically bundled when saving any files in the project (css, twig, img, svg etc) and the content is generated in /dist.

The content of /DIST is the actual website to be deployed on a server, all the rest is for developement purpose only. 