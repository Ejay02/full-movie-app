import axios from "axios";
const token = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkYmEzZWE5MGU1MWM3Yzg2OTlhZDgwOGU2ZDVhY2Y5MiIsInN1YiI6IjYyNDQ1OGZjN2NhYTQ3MDA1YzI5NGZhMiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.bTZk1OP60FU7NQ1gV3bfoBNs1CecHt7Sza3te9WsX8g"

export default axios.create({
  baseURL: "https://api.themoviedb.org/3",
  headers: {  Authorization: `Bearer ${token}` }
});

