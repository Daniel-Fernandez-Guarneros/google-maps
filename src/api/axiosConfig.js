
import axios from 'axios';

let spinnerCallback = null;

export const setSpinnerCallback = (callback) => {
  spinnerCallback = callback;
};

const instance = axios.create();

instance.interceptors.request.use((config) => {
  if ((config.method === 'post') && spinnerCallback) {
    spinnerCallback(true); // Iniciar el Spinner
  }
  config.metadata = { startTime: new Date() }; //tiempo de inicio
  return config;
});

instance.interceptors.response.use(
  (response) => {
    if ((response.config.method === 'post') && spinnerCallback) {
      const endTime = new Date();
      const elapsedTime = endTime - response.config.metadata.startTime;
      const totalWaitTime = 1000 + elapsedTime; // 1 segundo + respuesta

      setTimeout(() => spinnerCallback(false), totalWaitTime); // Detener el Spinner
    }
    return response;
  },
  (error) => {
    if ((error.config.method === 'post') && spinnerCallback) {
      const endTime = new Date();
      const elapsedTime = endTime - error.config.metadata.startTime;
      const totalWaitTime = 1000 + elapsedTime;
      setTimeout(() => spinnerCallback(false), totalWaitTime); // Detener  en caso de error
    }
    return Promise.reject(error);
  }
);

export default instance;
