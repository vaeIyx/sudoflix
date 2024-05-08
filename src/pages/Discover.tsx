import React, { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { ThinContainer } from "@/components/layout/ThinContainer";
import { WideContainer } from "@/components/layout/WideContainer";
import { Divider } from "@/components/utils/Divider";
import { Flare } from "@/components/utils/Flare";
import { HomeLayout } from "@/pages/layouts/HomeLayout";
import { conf } from "@/setup/config";
import {
  Category,
  Genre,
  Media,
  Movie,
  TVShow,
  categories,
  tvCategories,
} from "@/utils/discover";

import { PageTitle } from "./parts/util/PageTitle";
import { get } from "../backend/metadata/tmdb";
import { Icon, Icons } from "../components/Icon";

export function Discover() {
  const { t } = useTranslation();
  const [showBg] = useState<boolean>(false);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [randomMovie, setRandomMovie] = useState<Movie | null>(null);
  const [genreMovies, setGenreMovies] = useState<{
    [genreId: number]: Movie[];
  }>({});
  const [countdown, setCountdown] = useState<number | null>(null);
  const navigate = useNavigate();
  const [categoryShows, setCategoryShows] = useState<{
    [categoryName: string]: Movie[];
  }>({});
  const [categoryMovies, setCategoryMovies] = useState<{
    [categoryName: string]: Movie[];
  }>({});
  const [tvGenres, setTVGenres] = useState<Genre[]>([]);
  const [tvShowGenres, setTVShowGenres] = useState<{
    [genreId: number]: TVShow[];
  }>({});
  const carouselRef = useRef<HTMLDivElement>(null);
  const carouselRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const gradientRef = useRef<HTMLDivElement>(null);
  const [countdownTimeout, setCountdownTimeout] =
    useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchMoviesForCategory = async (category: Category) => {
      try {
        const data = await get<any>(category.endpoint, {
          api_key: conf().TMDB_READ_API_KEY,
          language: "en-US",
        });

        setCategoryMovies((prevCategoryMovies) => ({
          ...prevCategoryMovies,
          [category.name]: data.results,
        }));
      } catch (error) {
        console.error(
          `Error fetching movies for category ${category.name}:`,
          error,
        );
      }
    };
    categories.forEach(fetchMoviesForCategory);
  }, []);

  useEffect(() => {
    const fetchShowsForCategory = async (category: Category) => {
      try {
        const data = await get<any>(category.endpoint, {
          api_key: conf().TMDB_READ_API_KEY,
          language: "en-US",
        });

        setCategoryShows((prevCategoryShows) => ({
          ...prevCategoryShows,
          [category.name]: data.results,
        }));
      } catch (error) {
        console.error(
          `Error fetching movies for category ${category.name}:`,
          error,
        );
      }
    };
    tvCategories.forEach(fetchShowsForCategory);
  }, []);

  // Fetch TV show genres
  useEffect(() => {
    const fetchTVGenres = async () => {
      try {
        const data = await get<any>("/genre/tv/list", {
          api_key: conf().TMDB_READ_API_KEY,
          language: "en-US",
        });

        // Shuffle the array of genres
        for (let i = data.genres.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [data.genres[i], data.genres[j]] = [data.genres[j], data.genres[i]];
        }

        // Fetch only the first 5 TV show genres
        setTVGenres(data.genres.slice(0, 5));
      } catch (error) {
        console.error("Error fetching TV show genres:", error);
      }
    };

    fetchTVGenres();
  }, []);

  // Fetch TV shows for each genre
  useEffect(() => {
    const fetchTVShowsForGenre = async (genreId: number) => {
      try {
        const data = await get<any>("/discover/tv", {
          api_key: conf().TMDB_READ_API_KEY,
          with_genres: genreId.toString(),
          language: "en-US",
        });
        setTVShowGenres((prevTVShowGenres) => ({
          ...prevTVShowGenres,
          [genreId]: data.results,
        }));
      } catch (error) {
        console.error(`Error fetching TV shows for genre ${genreId}:`, error);
      }
    };

    tvGenres.forEach((genre) => fetchTVShowsForGenre(genre.id));
  }, [tvGenres]);

  // Update the scrollCarousel function to use the new ref map
  function scrollCarousel(categorySlug: string, direction: string) {
    const carousel = carouselRefs.current[categorySlug];
    if (carousel) {
      const movieElements = carousel.getElementsByTagName("a");
      if (movieElements.length > 0) {
        const movieWidth = movieElements[0].offsetWidth;
        const visibleMovies = Math.floor(carousel.offsetWidth / movieWidth);
        const scrollAmount = movieWidth * visibleMovies * 0.69; // Silly number :3
        if (direction === "left") {
          if (carousel.scrollLeft <= 5) {
            carousel.scrollBy({
              left: carousel.scrollWidth,
              behavior: "smooth",
            }); // Scroll to the end
          } else {
            carousel.scrollBy({ left: -scrollAmount, behavior: "smooth" });
          }
        } else if (
          carousel.scrollLeft + carousel.offsetWidth + 5 >=
          carousel.scrollWidth
        ) {
          carousel.scrollBy({
            left: -carousel.scrollWidth,
            behavior: "smooth",
          }); // Scroll to the beginning
        } else {
          carousel.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
      }
    }
  }

  const [movieWidth, setMovieWidth] = useState(
    window.innerWidth < 600 ? "150px" : "200px",
  );

  useEffect(() => {
    const handleResize = () => {
      setMovieWidth(window.innerWidth < 600 ? "150px" : "200px");
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (carouselRef.current && gradientRef.current) {
      const carouselHeight = carouselRef.current.getBoundingClientRect().height;
      gradientRef.current.style.top = `${carouselHeight}px`;
      gradientRef.current.style.bottom = `${carouselHeight}px`;
    }
  }, [movieWidth]);

  let isScrolling = false;
  function handleWheel(e: React.WheelEvent, categorySlug: string) {
    if (isScrolling) {
      return;
    }

    isScrolling = true;

    const carousel = carouselRefs.current[categorySlug];
    if (carousel) {
      const movieElements = carousel.getElementsByTagName("a");
      if (movieElements.length > 0) {
        const posterWidth = movieElements[0].offsetWidth;
        const visibleMovies = Math.floor(carousel.offsetWidth / posterWidth);
        const scrollAmount = posterWidth * visibleMovies * 0.6;
        if (e.deltaY < 5) {
          carousel.scrollBy({ left: -scrollAmount, behavior: "smooth" });
        } else {
          carousel.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
      }
    }

    setTimeout(() => {
      isScrolling = false;
    }, 345); // Disable scrolling every 3 milliseconds after interaction (only for mouse wheel doe)
  }

  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    document.body.style.overflow = "hidden";
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    document.body.style.overflow = "auto";
    setIsHovered(false);
  };

  function renderMovies(medias: Media[], category: string, isTVShow = false) {
    const categorySlug = `${category.toLowerCase().replace(/ /g, "-")}${Math.random()}`; // Convert the category to a slug
    const displayCategory =
      category === "Now Playing"
        ? "In Cinemas"
        : category.includes("Movie")
          ? `${category}s`
          : isTVShow
            ? `${category} Shows`
            : `${category} Movies`;
    return (
      <div className="relative overflow-hidden mt-2">
        <h2 className="text-2xl cursor-default font-bold text-white sm:text-3xl md:text-2xl mx-auto pl-6">
          {displayCategory}
        </h2>
        <div
          id={`carousel-${categorySlug}`}
          className="flex whitespace-nowrap pt-4 overflow-auto scrollbar rounded-xl overflow-y-hidden"
          style={{
            scrollbarWidth: "thin",
            // scrollbarColor: `${bgColor} transparent`,
            scrollbarColor: "transparent transparent",
          }}
          ref={(el) => {
            carouselRefs.current[categorySlug] = el;
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onWheel={(e) => handleWheel(e, categorySlug)}
        >
          {medias.slice(0, 20).map((media) => (
            <a
              key={media.id}
              onClick={() =>
                navigate(
                  `/media/tmdb-${isTVShow ? "tv" : "movie"}-${media.id}-${
                    isTVShow ? media.name : media.title
                  }`,
                )
              }
              className="text-center relative mt-3 ml-[0.285em] mb-3 mr-[0.2em]"
              style={{ flex: `0 0 ${movieWidth}` }} // Set a fixed width for each movie
            >
              <div className="relative transition-transform hover:scale-105 duration-[0.45s]">
                <Flare.Base className="group cursor-pointer rounded-xl relative p-[0.65em] bg-background-main transition-colors duration-300">
                  <Flare.Light
                    flareSize={300}
                    cssColorVar="--colors-mediaCard-hoverAccent"
                    backgroundClass="bg-mediaCard-hoverBackground duration-200"
                    className="rounded-xl bg-background-main group-hover:opacity-100"
                  />
                  <img
                    src={`https://image.tmdb.org/t/p/w500${media.poster_path}`}
                    alt="failed to fetch :("
                    loading="lazy"
                    className="rounded-xl relative"
                  />
                  <h1 className="group relative pt-2 text-[13.5px] whitespace-normal duration-[0.35s] font-semibold text-white opacity-0 group-hover:opacity-100">
                    {isTVShow
                      ? (media.name?.length ?? 0) > 32
                        ? `${media.name?.slice(0, 32)}...`
                        : media.name
                      : (media.title?.length ?? 0) > 32
                        ? `${media.title?.slice(0, 32)}...`
                        : media.title}
                  </h1>
                </Flare.Base>
              </div>
            </a>
          ))}
        </div>

        <div className="flex items-center justify-center">
          <button
            type="button"
            title="Back"
            className="absolute left-5 top-1/2 transform -translate-y-3/4 z-10"
            onClick={() => scrollCarousel(categorySlug, "left")}
          >
            <div className="cursor-pointer text-white flex justify-center items-center h-10 w-10 rounded-full bg-search-hoverBackground active:scale-110 transition-[transform,background-color] duration-200">
              <Icon icon={Icons.ARROW_LEFT} />
            </div>
          </button>
          <button
            type="button"
            title="Next"
            className="absolute right-5 top-1/2 transform -translate-y-3/4 z-10"
            onClick={() => scrollCarousel(categorySlug, "right")}
          >
            <div className="cursor-pointer text-white flex justify-center items-center h-10 w-10 rounded-full bg-search-hoverBackground active:scale-110 transition-[transform,background-color] duration-200">
              <Icon icon={Icons.ARROW_RIGHT} />
            </div>
          </button>
        </div>
      </div>
    );
  }

  const handleRandomMovieClick = () => {
    const allMovies = Object.values(genreMovies).flat(); // Flatten all movie arrays
    const uniqueTitles = new Set<string>(); // Use a Set to store unique titles
    allMovies.forEach((movie) => uniqueTitles.add(movie.title)); // Add each title to the Set
    const uniqueTitlesArray = Array.from(uniqueTitles); // Convert the Set back to an array
    const randomIndex = Math.floor(Math.random() * uniqueTitlesArray.length);
    const selectedMovie = allMovies.find(
      (movie) => movie.title === uniqueTitlesArray[randomIndex],
    );

    if (selectedMovie) {
      setRandomMovie(selectedMovie);

      if (countdown !== null && countdown > 0) {
        // Clear the countdown
        setCountdown(null);
        if (countdownTimeout) {
          clearTimeout(countdownTimeout);
          setCountdownTimeout(null);
          setRandomMovie(null);
        }
      } else {
        setCountdown(5);

        // Schedule navigation after 5 seconds
        const timeoutId = setTimeout(() => {
          navigate(
            `/media/tmdb-movie-${selectedMovie.id}-${selectedMovie.title}`,
          );
        }, 5000);
        setCountdownTimeout(timeoutId);
      }
    }
  };

  // Fetch Movie genres
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const data = await get<any>("/genre/movie/list", {
          api_key: conf().TMDB_READ_API_KEY,
          language: "en-US",
        });

        // Shuffle the array of genres
        for (let i = data.genres.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [data.genres[i], data.genres[j]] = [data.genres[j], data.genres[i]];
        }

        // Fetch only the first 4 genres
        setGenres(data.genres.slice(0, 4));
      } catch (error) {
        console.error("Error fetching genres:", error);
      }
    };

    fetchGenres();
  }, []);

  // Fetch movies for each genre
  useEffect(() => {
    const fetchMoviesForGenre = async (genreId: number) => {
      try {
        const movies: any[] = [];
        for (let page = 1; page <= 5; page += 1) {
          // Fetch only 5 pages
          const data = await get<any>("/discover/movie", {
            api_key: conf().TMDB_READ_API_KEY,
            with_genres: genreId.toString(),
            language: "en-US",
            page: page.toString(),
          });

          movies.push(...data.results);
        }
        setGenreMovies((prevGenreMovies) => ({
          ...prevGenreMovies,
          [genreId]: movies,
        }));
      } catch (error) {
        console.error(`Error fetching movies for genre ${genreId}:`, error);
      }
    };

    genres.forEach((genre) => fetchMoviesForGenre(genre.id));
  }, [genres]);

  useEffect(() => {
    let countdownInterval: NodeJS.Timeout;
    if (countdown !== null && countdown > 0) {
      countdownInterval = setInterval(() => {
        setCountdown((prevCountdown) =>
          prevCountdown !== null ? prevCountdown - 1 : prevCountdown,
        );
      }, 1000);
    }

    return () => {
      clearInterval(countdownInterval);
    };
  }, [countdown]);

  return (
    <HomeLayout showBg={showBg}>
      <div className="mb-16 sm:mb-2">
        <Helmet>
          {/* Hide scrollbar lmao */}
          <style type="text/css">{`
            html, body {
              scrollbar-width: none;
              -ms-overflow-style: none;
            }
          `}</style>
        </Helmet>
        <PageTitle subpage k="global.pages.discover" />
        <ThinContainer>
          <div className="mt-44 space-y-16 text-center">
            <div className="relative z-10 mb-16">
              <h1 className="text-4xl cursor-default font-bold text-white">
                {t("global.pages.discover")}
              </h1>
            </div>
          </div>
        </ThinContainer>
      </div>
      <WideContainer>
        <>
          <div className="flex items-center justify-center mb-6">
            <button
              type="button"
              className="flex items-center space-x-2 rounded-full px-4 text-white py-2 bg-pill-background bg-opacity-50 hover:bg-pill-backgroundHover transition-[background,transform] duration-100 hover:scale-105"
              onClick={handleRandomMovieClick}
            >
              <span className="flex items-center">
                {countdown !== null && countdown > 0 ? (
                  <div className="flex items-center inline-block">
                    <span>Cancel Countdown</span>
                    <Icon
                      icon={Icons.X}
                      className="text-2xl ml-[4.5px] mb-[-0.7px]"
                    />
                  </div>
                ) : (
                  <div className="flex items-center inline-block">
                    <span>Watch Something New</span>
                    <img
                      src="/lightbar-images/dice.svg"
                      alt="Small Image"
                      style={{
                        marginLeft: "8px",
                      }}
                    />
                  </div>
                )}
              </span>
            </button>
          </div>
          {randomMovie && (
            <div className="mt-4 mb-4 text-center">
              <p>
                Now Playing{" "}
                <span className="font-bold">{randomMovie.title}</span> in{" "}
                {countdown}
              </p>
            </div>
          )}
          <div className="flex flex-col">
            {categories.map((category) => (
              <div
                key={category.name}
                id={`carousel-${category.name
                  .toLowerCase()
                  .replace(/ /g, "-")}`}
                className="mt-8"
              >
                {renderMovies(
                  categoryMovies[category.name] || [],
                  category.name,
                )}
              </div>
            ))}
            {genres.map((genre) => (
              <div
                key={genre.id}
                id={`carousel-${genre.name.toLowerCase().replace(/ /g, "-")}`}
                className="mt-8"
              >
                {renderMovies(genreMovies[genre.id] || [], genre.name)}
              </div>
            ))}
            <div className="flex items-center">
              <Divider marginClass="mr-5" />
              <h1 className="text-4xl font-bold text-white mx-auto">Shows</h1>
              <Divider marginClass="ml-5" />
            </div>
            {tvCategories.map((category) => (
              <div
                key={category.name}
                id={`carousel-${category.name
                  .toLowerCase()
                  .replace(/ /g, "-")}`}
                className="mt-8"
              >
                {renderMovies(
                  categoryShows[category.name] || [],
                  category.name,
                  true,
                )}
              </div>
            ))}
            {tvGenres.map((genre) => (
              <div
                key={genre.id}
                id={`carousel-${genre.name.toLowerCase().replace(/ /g, "-")}`}
                className="mt-8"
              >
                {renderMovies(tvShowGenres[genre.id] || [], genre.name, true)}
              </div>
            ))}
          </div>
        </>
      </WideContainer>
    </HomeLayout>
  );
}
