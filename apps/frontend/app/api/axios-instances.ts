import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8080/';
const OLLAMA_BASE_URL = import.meta.env.VITE_OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434/';

export const apiAds = axios.create({
  baseURL: API_BASE_URL,
});

export const apiOllama = axios.create({
  baseURL: OLLAMA_BASE_URL,
});
