import { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import { ParsedUrlQuery } from 'querystring';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useRecoilState } from 'recoil';
import { useEffectOnce, useMediaQuery } from 'usehooks-ts';
import { chapterList } from '~/atoms/chapterListAtom';
import withDbScroll from '~/components/hoc/withDbScroll';
import MainLayout from '~/components/layouts/MainLayout';
import ClientOnly from '~/components/shared/ClientOnly';
import DetailsBanner from '~/components/shared/DetailsBanner';
import DetailsChapterList from '~/components/shared/DetailsChapterList';
import DetailsDescription from '~/components/shared/DetailsDescription';
import DetailsInfo from '~/components/shared/DetailsInfo';
import Head from '~/components/shared/Head';
import Section from '~/components/shared/Section';
import { REVALIDATE_TIME } from '~/constants';
import RepositoryFactory from '~/services/repositoryFactory';
import { HeadlessManga, MangaDetails } from '~/types';

const NtApi = RepositoryFactory('nettruyen');

interface Params extends ParsedUrlQuery {
    slug: string;
}

interface DetailsPageProps {
    manga: MangaDetails;
}

const DetailsPage: NextPage<DetailsPageProps> = ({ manga }) => {
    const matchesMobile = useMediaQuery('(max-width: 768px)');
    const router = useRouter();
    const [isLoading, setLoading] = useState(false);
    const [_, setChapterList] = useRecoilState(chapterList);

    useEffectOnce(() => {
        if (manga)
            setChapterList({
                title: manga.title,
                chapterList: manga.chapterList,
            } as HeadlessManga);
    });

    useEffect(() => {
        if (router.isFallback) {
            setLoading(true);
        } else {
            setLoading(false);
        }
    }, [router.isFallback]);

    const comicSlug = useMemo(() => {
        return router.asPath.slice(
            router.asPath.lastIndexOf('/') + 1,
            router.asPath.indexOf('?'),
        );
    }, [router.asPath]);

    return (
        <ClientOnly>
            <Head
                title={`${manga?.title} - Kyoto Manga`}
                description={`${manga?.review}`}
                image={`${manga?.thumbnail}`}
            />

            <div className="flex h-fit min-h-screen flex-col">
                <DetailsBanner
                    isLoading={isLoading}
                    imgUrl={manga?.thumbnail || 'notFound'}
                />

                <div className="z-10 mx-auto min-h-screen w-[85%] pt-32">
                    <Section style="h-fit w-full">
                        <DetailsInfo
                            isLoading={isLoading}
                            manga={manga}
                            comicSlug={comicSlug}
                        />
                    </Section>

                    <Section style="h-fit w-full">
                        <DetailsDescription
                            isLoading={isLoading}
                            mangaReview={manga?.review || ''}
                            mobileUI={matchesMobile}
                        />
                    </Section>

                    <Section title="Danh sách chương" style="h-fit w-full">
                        <DetailsChapterList
                            containerStyle="my-6 flex h-fit w-full flex-col overflow-x-hidden rounded-xl bg-highlight"
                            maxWTitleMobile={200}
                            selectSource
                            mobileHeight={600}
                            chapterList={manga?.chapterList || []}
                            comicSlug={comicSlug}
                            mobileUI={matchesMobile}
                        />
                    </Section>
                </div>
            </div>
        </ClientOnly>
    );
};
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
export const getStaticProps: GetStaticProps<DetailsPageProps, Params> = async (
    ctx,
) => {
    try {
        const { slug } = ctx.params as Params;
        const host = process.env['HOST_NAME'];

        //config dynamic source later
        const res = await (await fetch(`${host}/api/comic/nt/${slug}`)).json();

        if (res.success && res.data.title) {
            return {
                props: { manga: res.data },
                revalidate: REVALIDATE_TIME,
            };
        } else {
            return { notFound: true };
        }
    } catch (err) {
        console.log(err);
        return { notFound: true };
    }
};
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
export const getStaticPaths: GetStaticPaths<Params> = async () => {
    const [
        topMonthList,
        newMangaUpdated,
        topAllManga,
        topMonthManga,
        topWeekManga,
        topDayManga,
        newManga,
    ] = await Promise.all([
        NtApi?.filter(1, 'manga-112', 'month').then((res) => {
            if (res.status === 200 && res.data) {
                return res.data.data;
            }
            return [];
        }),
        NtApi?.getNewMangaUpdated(1).then((res) => {
            if (res.status === 200 && res.data) {
                return res.data.data;
            }
            return [];
        }),
        NtApi?.getRankingmanga(undefined, 'all', 1).then((res) => {
            if (res.status === 200 && res.data) {
                return res.data.data;
            }
            return [];
        }),
        NtApi?.getRankingmanga(undefined, 'month', 1).then((res) => {
            if (res.status === 200 && res.data) {
                return res.data.data;
            }
            return [];
        }),
        NtApi?.getRankingmanga(undefined, 'week', 1).then((res) => {
            if (res.status === 200 && res.data) {
                return res.data.data;
            }
            return [];
        }),
        NtApi?.getRankingmanga(undefined, 'day', 1).then((res) => {
            if (res.status === 200 && res.data) {
                return res.data.data;
            }
            return [];
        }),
        NtApi?.getNewManga(1).then((res) => {
            if (res.status === 200 && res.data) {
                return res.data.data;
            }
            return [];
        }),
    ]);

    if (
        topMonthList &&
        newMangaUpdated &&
        topAllManga &&
        topMonthManga &&
        topWeekManga &&
        topDayManga &&
        newManga
    ) {
        const paths = [
            ...topMonthList,
            ...newMangaUpdated,
            ...topAllManga,
            ...topMonthManga,
            ...topWeekManga,
            ...topDayManga,
            ...newManga,
        ].map((manga) => ({
            params: {
                slug: manga.slug,
            },
        }));
        return { paths, fallback: true };
    }
};

const DetailsPageWidthDbScrollTT = withDbScroll<DetailsPageProps>(DetailsPage);

export default DetailsPageWidthDbScrollTT;

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
DetailsPageWidthDbScrollTT.getLayout = (page: ReactNode) => {
    return (
        <MainLayout
            showHeader
            showFooter
            customStyleHeader={
                'w-full max-w-[1400px] h-40 absolute top-[-10px] z-50 left-1/2 -translate-x-1/2 bg-transparent'
            }
        >
            {page}
        </MainLayout>
    );
};
