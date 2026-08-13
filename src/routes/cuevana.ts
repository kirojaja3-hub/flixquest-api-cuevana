import { FastifyInstance } from "fastify";
import { getCuevanaStreams } from "../providers/cuevana";

const routes = async (fastify: FastifyInstance) => {
    fastify.get("/", async (_, rp) => {
        rp.status(200).send({
            intro: "Welcome to the Cuevana provider",
            routes: {
                movie: "/watch-movie?title=TITLE&year=YEAR&language=LANGUAGE",
                tv: "/watch-tv?title=TITLE&year=YEAR&season=SEASON&episode=EPISODE&language=LANGUAGE",
            },
            languages: ["latino", "español", "subtitulado"],
        });
    });

    // Movie endpoint
    fastify.get("/watch-movie", async (request, reply) => {
        const { title, year, language } = request.query as {
            title?: string;
            year?: string;
            language?: string;
        };

        if (!title) {
            return reply.status(400).send({
                error: "Missing required parameter: title",
            });
        }

        try {
            const streams = await getCuevanaStreams(
                title,
                year ? parseInt(year) : undefined,
                undefined,
                undefined,
                language,
            );

            if (streams.length === 0) {
                return reply.status(404).send({
                    message: "No streams found",
                });
            }

            return reply.status(200).send({
                title,
                year: year || null,
                type: "movie",
                streams,
            });
        } catch (error: any) {
            return reply.status(500).send({
                error: "Failed to fetch streams",
                details: error.message,
            });
        }
    });

    // TV Show endpoint
    fastify.get("/watch-tv", async (request, reply) => {
        const { title, year, season, episode, language } = request.query as {
            title?: string;
            year?: string;
            season?: string;
            episode?: string;
            language?: string;
        };

        if (!title || !season || !episode) {
            return reply.status(400).send({
                error: "Missing required parameters: title, season, episode",
            });
        }

        try {
            const streams = await getCuevanaStreams(
                title,
                year ? parseInt(year) : undefined,
                parseInt(season),
                parseInt(episode),
                language,
            );

            if (streams.length === 0) {
                return reply.status(404).send({
                    message: "No streams found",
                });
            }

            return reply.status(200).send({
                title,
                year: year || null,
                season: parseInt(season),
                episode: parseInt(episode),
                type: "tv",
                streams,
            });
        } catch (error: any) {
            return reply.status(500).send({
                error: "Failed to fetch streams",
                details: error.message,
            });
        }
    });
};

export default routes;
