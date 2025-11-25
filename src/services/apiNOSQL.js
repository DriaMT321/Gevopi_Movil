import axios from 'axios';

const graphqlApi = axios.create({
  //baseURL: 'http://10.26.4.122:9090/graphql',
  //baseURL: 'http://192.168.0.10:9090/graphql',
  baseURL: 'http://10.26.6.40:9090/graphql',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default graphqlApi;
