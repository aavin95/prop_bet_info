// pages/index.tsx

import Head from 'next/head';
import SearchBar from '../components/SearchBar';

const Home = () => {
  return (
    <>
      <Head>
        <title>Player Search</title>
        <meta name="description" content="Search for players" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-white">
        <SearchBar />
      </div>
    </>
  );
};

export default Home;
