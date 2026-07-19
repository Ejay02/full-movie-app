# Latest Movie App

Welcome to the Latest Movie App! This app showcases the latest movies and their trailers. Dive into the world of cinema and stay updated with the newest releases.

## Demo

Check out the live demo of the app [here](https://latest-movie-app-ej.netlify.app/).

## Features

- **Latest Movies:** Get the most recent movies updated regularly.
- **Trailers:** Watch trailers for the latest movies.
- **Actor Information:** View detailed information about actors.
- **Search Functionality:** Search for your favorite movies and actors.
- **Responsive Design:** Enjoy a seamless experience on any device.


## Technologies Used

- **Frontend:**
  - HTML
  - CSS
  - JavaScript
  - Vue.js


## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/Ejay02/full-movie-app.git
    ```

2. Navigate to the project directory:
    ```sh
    cd latest-movie-app
    ```

3. Install the dependencies:
    ```sh
    npm install
    ```

4. Create a local environment file and add your TMDB bearer token:
    ```sh
    copy .env.example .env
    ```

5. Start the TMDB proxy in one terminal:
    ```sh
    npm run proxy
    ```

6. Start the development server in a second terminal:
    ```sh
    npm run serve
    ```

7. Open your browser and go to `http://localhost:8080` to see the app in action.

## Security

- TMDB requests now go through a local or Netlify-hosted proxy instead of exposing the bearer token in the browser bundle.
- Set `TMDB_API_TOKEN` in `.env` for local proxy usage.
- Netlify deployments should configure `TMDB_API_TOKEN` as an environment variable for the function runtime.

## Contributing

We welcome contributions to the Latest Movie App! If you have suggestions or improvements, please follow these steps:

1. Fork the repository.
2. Create a new branch: `git checkout -b feature/your-feature-name`.
3. Make your changes and commit them: `git commit -m 'Add some feature'`.
4. Push to the branch: `git push origin feature/your-feature-name`.
5. Open a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

If you have any questions or feedback, please feel free to reach out:

- Email: e.jae02@gmail.com

---

Enjoy the latest movies trailers with the Latest Movie App! 🎬🍿


