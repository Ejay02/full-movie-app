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

## Shared games and playback

- First-visit setup asks who is watching and offers five avatars. Each person's avatar is saved locally and shared through Firebase; it can be changed later from the profile menu.
- Game Night restores each room's existing Whot, Word Duel and Scrabble match. Opening a game no longer deals a new match. Local storage keeps a device copy; Firebase stores the shared match. Conflicting moves are rejected instead of overwriting another player's turn.
- Whot uses two-player house rules: Hold On, Suspension, Pick 2, Pick 3 and General Market let the player play again. Penalty cards draw automatically for the opponent. A normal market draw ends your turn.
- Queue selections now default to Together Player. The `/api/stream` backend resolves a title to an HLS stream and the app plays it with HLS.js, without running the provider's advertising page. Solo watching uses the same source endpoint. Source availability still depends on the upstream service.
- Together Player shares play, pause, seeking and periodic position updates through Firebase. Joiners restore the shared position. Browsers may require a tap before allowing playback.
- Select a title, then **Use a direct video** to enter an HTTPS MP4/WebM URL accessible on both devices. Privately configured video entries in `src/data/personalMediaLibrary.js` also use the shared player. A URL must point to a playable video, not a webpage, and must stay accessible for both viewers.
- Public iframe server choices have been removed: they reject sandboxed playback and cannot provide the room's linked controls. Saved selections are reopened with Together Player, preserving any recorded position. Privately configured embeds retain the restrictive sandbox.
- Home Continue Watching opens the player directly. Video progress is saved on pause, seeking, page hide and navigation; loading events cannot overwrite it before restoration. Older iframe entries with no recorded position show Watch instead of Resume.
- Crossword Go uses original picture and word clues inside an 8×8 board, five letter tiles, alternating turns and shared scores. There are two original boards. Each tile earns 1 point and each completed word 5 extra. Submitted moves persist per room; unfinished placements are cached per player and revision. The earlier text-clue puzzle data remains stored separately and is not overwritten.
- Word Duel remains available. Whot keeps turn status, the card to match and the draw action beside the hand, fixed to the bottom on smaller screens.
- Inter typography and cinematic CSS effects apply throughout the app. Motion respects reduced-motion preferences and quiets during video playback. Effects are resolution-independent; actual video quality comes from the source.
- Local development needs both `npm run proxy` and `npm run serve`. Netlify routes `/api/stream` to the included stream function. The resolver accepts only validated movie/episode identifiers, fetches a fixed upstream origin, and never executes provider scripts or proxies arbitrary URLs.
- Run `npm test` for offline regression checks and `npm run lint -- --no-fix` for linting. Test live playback in an isolated room, rather than changing the active date-night room.

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


