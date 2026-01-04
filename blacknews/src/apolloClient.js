import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { setContext, SetContextLink } from '@apollo/client/link/context';

const httpLink = new  HttpLink({
  uri: 'http://localhost:4000/graphql',
});

const authLink = new  SetContextLink((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

export default client;