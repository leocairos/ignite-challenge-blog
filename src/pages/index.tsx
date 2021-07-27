import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import Link from 'next/link';
import Head from 'next/head';
import { FiCalendar, FiUser } from 'react-icons/fi';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useState } from 'react';

import { useEffect } from 'react';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

const formattedDate = (date: string): string => {
  return format(new Date(date), 'dd MMM yyyy', { locale: ptBR });
};

export default function Home({
  postsPagination,
  preview,
}: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState<string>(postsPagination.next_page);
  const [currentPage, setCurrentPage] = useState(1);

  async function loadMorePosts(): Promise<void> {
    if (currentPage !== 1 && nextPage === null) {
      return;
    }

    const postsResults = await fetch(`${nextPage}`).then(response =>
      response.json()
    );
    setNextPage(postsResults.next_page);
    setCurrentPage(postsResults.page);

    const newPosts = postsResults.results.map(post => {
      return {
        ...post,
        first_publication_date: formattedDate(post.first_publication_date),
      };
    });

    setPosts([...posts, ...newPosts]);
  }

  return (
    <>
      <Head>
        <title>Posts | spacetraveling</title>
      </Head>

      <main className={commonStyles.container}>
        <div className={styles.post}>
          {posts.map(post => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a key={post.uid}>
                <h1>{post.data.title}</h1>
                <p>{post.data.subtitle}</p>
                <div className={styles.info}>
                  <span>
                    <FiCalendar /> {formattedDate(post.first_publication_date)}
                  </span>
                  <span>
                    <FiUser /> {post.data.author}
                  </span>
                </div>
              </a>
            </Link>
          ))}
          {nextPage && (
            <button
              type="button"
              onClick={loadMorePosts}
              className={styles.loadMorePosts}
            >
              Carregar mais posts
            </button>
          )}
        </div>

        {preview && (
          <aside>
            <Link href="/api/exit-preview">
              <a className={commonStyles.preview}>Sair do modo Preview</a>
            </Link>
          </aside>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ preview = false }) => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['post.title', 'post.subtitle', 'post.author'],
      pageSize: 2,
    }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const postsPagination = {
    results: posts,
    next_page: postsResponse.next_page,
  };

  return {
    props: {
      postsPagination,
      preview,
    },
    // revalidate: 1800,
  };
};
