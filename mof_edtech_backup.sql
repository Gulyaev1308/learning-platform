--
-- PostgreSQL database cluster dump
--

\restrict cTn1eTkYzVAVubXbtg4fQOa0SarYkOcy49s90bc2QvCNywErJkHVhGUz36r2kGP

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Roles
--

CREATE ROLE learning_admin;
ALTER ROLE learning_admin WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:iJXH80z43gA4tessQRVjmA==$GaGuBgEk4rwjfpJ9+2GX1xw9rJLHpq0D8fTPV+AvaEk=:KgkOa8Du9SaxV2iNm4GJOEx7WK3lKBXNlKu7NcDMb3c=';

--
-- User Configurations
--








\unrestrict cTn1eTkYzVAVubXbtg4fQOa0SarYkOcy49s90bc2QvCNywErJkHVhGUz36r2kGP

--
-- Databases
--

--
-- Database "template1" dump
--

\connect template1

--
-- PostgreSQL database dump
--

\restrict 35sBSofyDCO90gmhDmMlStBd9rly6hkuyCw776yW7V2j0E4xNVTbXFZdDbn2cAm

-- Dumped from database version 15.19
-- Dumped by pg_dump version 15.19

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- PostgreSQL database dump complete
--

\unrestrict 35sBSofyDCO90gmhDmMlStBd9rly6hkuyCw776yW7V2j0E4xNVTbXFZdDbn2cAm

--
-- Database "learning_platform_db" dump
--

--
-- PostgreSQL database dump
--

\restrict xS0BvNfwv1NYAWkQXAw0ogYeLtm83gZ5gvdpjdMZcLFxAd7oW7aVTvnUAnOxGLX

-- Dumped from database version 15.19
-- Dumped by pg_dump version 15.19

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: learning_platform_db; Type: DATABASE; Schema: -; Owner: learning_admin
--

CREATE DATABASE learning_platform_db WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE learning_platform_db OWNER TO learning_admin;

\unrestrict xS0BvNfwv1NYAWkQXAw0ogYeLtm83gZ5gvdpjdMZcLFxAd7oW7aVTvnUAnOxGLX
\connect learning_platform_db
\restrict xS0BvNfwv1NYAWkQXAw0ogYeLtm83gZ5gvdpjdMZcLFxAd7oW7aVTvnUAnOxGLX

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: blocks; Type: TABLE; Schema: public; Owner: learning_admin
--

CREATE TABLE public.blocks (
    id integer NOT NULL,
    leader_id integer,
    title character varying(255) NOT NULL,
    description text,
    order_index integer DEFAULT 1 NOT NULL,
    is_premium boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.blocks OWNER TO learning_admin;

--
-- Name: blocks_id_seq; Type: SEQUENCE; Schema: public; Owner: learning_admin
--

CREATE SEQUENCE public.blocks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.blocks_id_seq OWNER TO learning_admin;

--
-- Name: blocks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: learning_admin
--

ALTER SEQUENCE public.blocks_id_seq OWNED BY public.blocks.id;


--
-- Name: lessons; Type: TABLE; Schema: public; Owner: learning_admin
--

CREATE TABLE public.lessons (
    id integer NOT NULL,
    module_id integer NOT NULL,
    title character varying(255) NOT NULL,
    type character varying(50) NOT NULL,
    content text,
    description text,
    order_index integer DEFAULT 1 NOT NULL,
    quiz_data jsonb DEFAULT '[]'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT lessons_type_check CHECK (((type)::text = ANY ((ARRAY['video'::character varying, 'text'::character varying, 'quiz'::character varying, 'practice'::character varying])::text[])))
);


ALTER TABLE public.lessons OWNER TO learning_admin;

--
-- Name: lessons_id_seq; Type: SEQUENCE; Schema: public; Owner: learning_admin
--

CREATE SEQUENCE public.lessons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.lessons_id_seq OWNER TO learning_admin;

--
-- Name: lessons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: learning_admin
--

ALTER SEQUENCE public.lessons_id_seq OWNED BY public.lessons.id;


--
-- Name: modules; Type: TABLE; Schema: public; Owner: learning_admin
--

CREATE TABLE public.modules (
    id integer NOT NULL,
    block_id integer NOT NULL,
    title character varying(255) NOT NULL,
    order_index integer DEFAULT 1 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.modules OWNER TO learning_admin;

--
-- Name: modules_id_seq; Type: SEQUENCE; Schema: public; Owner: learning_admin
--

CREATE SEQUENCE public.modules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.modules_id_seq OWNER TO learning_admin;

--
-- Name: modules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: learning_admin
--

ALTER SEQUENCE public.modules_id_seq OWNED BY public.modules.id;


--
-- Name: premium_access; Type: TABLE; Schema: public; Owner: learning_admin
--

CREATE TABLE public.premium_access (
    id integer NOT NULL,
    user_id integer NOT NULL,
    block_id integer NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    approved_by integer,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT premium_access_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.premium_access OWNER TO learning_admin;

--
-- Name: premium_access_id_seq; Type: SEQUENCE; Schema: public; Owner: learning_admin
--

CREATE SEQUENCE public.premium_access_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.premium_access_id_seq OWNER TO learning_admin;

--
-- Name: premium_access_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: learning_admin
--

ALTER SEQUENCE public.premium_access_id_seq OWNED BY public.premium_access.id;


--
-- Name: progress; Type: TABLE; Schema: public; Owner: learning_admin
--

CREATE TABLE public.progress (
    id integer NOT NULL,
    user_id integer NOT NULL,
    lesson_id integer NOT NULL,
    status character varying(50) DEFAULT 'completed'::character varying NOT NULL,
    video_last_position integer DEFAULT 0,
    completed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT progress_status_check CHECK (((status)::text = ANY ((ARRAY['completed'::character varying, 'in_progress'::character varying])::text[])))
);


ALTER TABLE public.progress OWNER TO learning_admin;

--
-- Name: progress_id_seq; Type: SEQUENCE; Schema: public; Owner: learning_admin
--

CREATE SEQUENCE public.progress_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.progress_id_seq OWNER TO learning_admin;

--
-- Name: progress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: learning_admin
--

ALTER SEQUENCE public.progress_id_seq OWNED BY public.progress.id;


--
-- Name: quiz_answers; Type: TABLE; Schema: public; Owner: learning_admin
--

CREATE TABLE public.quiz_answers (
    id integer NOT NULL,
    user_id integer NOT NULL,
    lesson_id integer NOT NULL,
    answers jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.quiz_answers OWNER TO learning_admin;

--
-- Name: quiz_answers_id_seq; Type: SEQUENCE; Schema: public; Owner: learning_admin
--

CREATE SEQUENCE public.quiz_answers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.quiz_answers_id_seq OWNER TO learning_admin;

--
-- Name: quiz_answers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: learning_admin
--

ALTER SEQUENCE public.quiz_answers_id_seq OWNED BY public.quiz_answers.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: learning_admin
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    role character varying(50) NOT NULL,
    leader_id integer,
    ref_code character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'leader'::character varying, 'student'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO learning_admin;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: learning_admin
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO learning_admin;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: learning_admin
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: blocks id; Type: DEFAULT; Schema: public; Owner: learning_admin
--

ALTER TABLE ONLY public.blocks ALTER COLUMN id SET DEFAULT nextval('public.blocks_id_seq'::regclass);


--
-- Name: lessons id; Type: DEFAULT; Schema: public; Owner: learning_admin
--

ALTER TABLE ONLY public.lessons ALTER COLUMN id SET DEFAULT nextval('public.lessons_id_seq'::regclass);


--
-- Name: modules id; Type: DEFAULT; Schema: public; Owner: learning_admin
--

ALTER TABLE ONLY public.modules ALTER COLUMN id SET DEFAULT nextval('public.modules_id_seq'::regclass);


--
-- Name: premium_access id; Type: DEFAULT; Schema: public; Owner: learning_admin
--

ALTER TABLE ONLY public.premium_access ALTER COLUMN id SET DEFAULT nextval('public.premium_access_id_seq'::regclass);


--
-- Name: progress id; Type: DEFAULT; Schema: public; Owner: learning_admin
--

ALTER TABLE ONLY public.progress ALTER COLUMN id SET DEFAULT nextval('public.progress_id_seq'::regclass);


--
-- Name: quiz_answers id; Type: DEFAULT; Schema: public; Owner: learning_admin
--

ALTER TABLE ONLY public.quiz_answers ALTER COLUMN id SET DEFAULT nextval('public.quiz_answers_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: learning_admin
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: blocks; Type: TABLE DATA; Schema: public; Owner: learning_admin
--

COPY public.blocks (id, leader_id, title, description, order_index, is_premium, created_at) FROM stdin;
7	8	Вводный блок	\N	1	f	2026-09-07 16:53:07.582687
8	8	Платный блок	\N	2	f	2026-09-16 05:36:03.757633
\.


--
-- Data for Name: lessons; Type: TABLE DATA; Schema: public; Owner: learning_admin
--

COPY public.lessons (id, module_id, title, type, content, description, order_index, quiz_data, created_at) FROM stdin;
1	6	Знакомство с президентом компании	video	/api/videos/video_1788800405279.mp4	📹 «Не из России, а из Сибири»: как Татьяна Гороховская построила международный бизнес!	1	{"type": "free_text", "questions": [{"question": "Что ближе лично вам и какие ценности вы разделяете?"}]}	2026-09-07 17:01:01.730505
2	6	Презентация компании Siberian Wellness	video	/api/videos/video_1788800656386.mp4	Всё о масштабе, ценностях и продуктовой концепции Siberian Wellness для вашей уверенной работы с первых дней!	1	{"type": "free_text", "questions": [{"question": "Что вас больше всего впечатлило в презентации?"}]}	2026-09-07 17:05:58.422628
\.


--
-- Data for Name: modules; Type: TABLE DATA; Schema: public; Owner: learning_admin
--

COPY public.modules (id, block_id, title, order_index, created_at) FROM stdin;
6	7	Знакомство с компанией Siberian Wellness	1	2026-09-07 16:55:19.045338
7	8	Практические задания	1	2026-09-16 05:36:17.196524
8	7	Кейсы и чеки	1	2026-09-16 05:37:49.836756
\.


--
-- Data for Name: premium_access; Type: TABLE DATA; Schema: public; Owner: learning_admin
--

COPY public.premium_access (id, user_id, block_id, status, approved_by, updated_at, created_at) FROM stdin;
\.


--
-- Data for Name: progress; Type: TABLE DATA; Schema: public; Owner: learning_admin
--

COPY public.progress (id, user_id, lesson_id, status, video_last_position, completed_at) FROM stdin;
1	9	1	completed	0	2026-09-08 04:54:19.489048
2	9	2	completed	0	2026-09-08 05:19:09.518129
\.


--
-- Data for Name: quiz_answers; Type: TABLE DATA; Schema: public; Owner: learning_admin
--

COPY public.quiz_answers (id, user_id, lesson_id, answers, created_at) FROM stdin;
1	9	1	[{"answer": "Очень близок подход Татьяны в отношении экологии, любви к Сибири. Однозначно подкупает то, что компания вкладывает большие средства в сохранение природы, животных. \\nА также полностью согласна с её утверждением: «люди тянутся к людям». Что человеку изначально должен понравиться продукт, чтобы его дальше продавать качественно и успешно.", "question": "Что ближе лично вам и какие ценности вы разделяете?"}]	2026-09-08 04:54:19.283097
2	9	2	[{"answer": "Репутация и належность компании (30лет) Собственно научно -технологический комплекс, упаковка только биоразлагаемая , возможность задать вопросы врачу на сайте, низкий ЛТО, интересные программы для БП (авто, путешествия)", "question": "Что вас больше всего впечатлило в презентации?"}]	2026-09-08 05:19:09.325009
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: learning_admin
--

COPY public.users (id, email, password_hash, name, role, leader_id, ref_code, created_at) FROM stdin;
1	admin@test.ru	$2b$10$sHUwzkIWe675QWU7FjhCT.xDg6y0kIY6j58GXrZnOK0fzZuVRXMnq	Евгений (Админ)	admin	\N	\N	2026-08-31 09:43:45.532069
8	Irina.sps84@mail.ru	$2b$10$MoTOAhKrG02gv2pUQgMIPeCnMUXl7vdwVBCLPkoSDJ9C9CtcLpxpK	Ирина 	leader	\N	\N	2026-09-07 16:50:34.298748
9	iriskans@yandex.ru	$2b$10$FCDqjNyxwtebIl1LfRUNq.s80CKMlLPf5C5EdIGmlsQGiMJGahvTi	Ирина	student	8	\N	2026-09-08 03:25:23.935712
\.


--
-- Name: blocks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: learning_admin
--

SELECT pg_catalog.setval('public.blocks_id_seq', 8, true);


--
-- Name: lessons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: learning_admin
--

SELECT pg_catalog.setval('public.lessons_id_seq', 2, true);


--
-- Name: modules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: learning_admin
--

SELECT pg_catalog.setval('public.modules_id_seq', 8, true);


--
-- Name: premium_access_id_seq; Type: SEQUENCE SET; Schema: public; Owner: learning_admin
--

SELECT pg_catalog.setval('public.premium_access_id_seq', 5, true);


--
-- Name: progress_id_seq; Type: SEQUENCE SET; Schema: public; Owner: learning_admin
--

SELECT pg_catalog.setval('public.progress_id_seq', 2, true);


--
-- Name: quiz_answers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: learning_admin
--

SELECT pg_catalog.setval('public.quiz_answers_id_seq', 2, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: learning_admin
--

SELECT pg_catalog.setval('public.users_id_seq', 9, true);


--
-- Name: blocks blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: learning_admin
--

ALTER TABLE ONLY public.blocks
    ADD CONSTRAINT blocks_pkey PRIMARY KEY (id);


--
-- Name: lessons lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: learning_admin
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_pkey PRIMARY KEY (id);


--
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: learning_admin
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);


--
-- Name: premium_access premium_access_pkey; Type: CONSTRAINT; Schema: public; Owner: learning_admin
--

ALTER TABLE ONLY public.premium_access
    ADD CONSTRAINT premium_access_pkey PRIMARY KEY (id);


--
-- Name: premium_access premium_access_user_id_block_id_key; Type: CONSTRAINT; Schema: public; Owner: learning_admin
--

ALTER TABLE ONLY public.premium_access
    ADD CONSTRAINT premium_access_user_id_block_id_key UNIQUE (user_id, block_id);


--
-- Name: progress progress_pkey; Type: CONSTRAINT; Schema: public; Owner: learning_admin
--

ALTER TABLE ONLY public.progress
    ADD CONSTRAINT progress_pkey PRIMARY KEY (id);


--
-- Name: progress progress_user_id_lesson_id_key; Type: CONSTRAINT; Schema: public; Owner: learning_admin
--

ALTER TABLE ONLY public.progress
    ADD CONSTRAINT progress_user_id_lesson_id_key UNIQUE (user_id, lesson_id);


--
-- Name: quiz_answers quiz_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: learning_admin
--

ALTER TABLE ONLY public.quiz_answers
    ADD CONSTRAINT quiz_answers_pkey PRIMARY KEY (id);


--
-- Name: quiz_answers quiz_answers_user_id_lesson_id_key; Type: CONSTRAINT; Schema: public; Owner: learning_admin
--

ALTER TABLE ONLY public.quiz_answers
    ADD CONSTRAINT quiz_answers_user_id_lesson_id_key UNIQUE (user_id, lesson_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: learning_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: learning_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_ref_code_key; Type: CONSTRAINT; Schema: public; Owner: learning_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_ref_code_key UNIQUE (ref_code);


--
-- Name: idx_blocks_order; Type: INDEX; Schema: public; Owner: learning_admin
--

CREATE INDEX idx_blocks_order ON public.blocks USING btree (order_index);


--
-- Name: idx_lessons_module; Type: INDEX; Schema: public; Owner: learning_admin
--

CREATE INDEX idx_lessons_module ON public.lessons USING btree (module_id);


--
-- Name: idx_modules_block; Type: INDEX; Schema: public; Owner: learning_admin
--

CREATE INDEX idx_modules_block ON public.modules USING btree (block_id);


--
-- Name: idx_progress_user; Type: INDEX; Schema: public; Owner: learning_admin
--

CREATE INDEX idx_progress_user ON public.progress USING btree (user_id);


--
-- Name: idx_quiz_user; Type: INDEX; Schema: public; Owner: learning_admin
--

CREATE INDEX idx_quiz_user ON public.quiz_answers USING btree (user_id);


--
-- Name: idx_users_leader; Type: INDEX; Schema: public; Owner: learning_admin
--

CREATE INDEX idx_users_leader ON public.users USING btree (leader_id);


--
-- Name: blocks blocks_leader_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learning_admin
--

ALTER TABLE ONLY public.blocks
    ADD CONSTRAINT blocks_leader_id_fkey FOREIGN KEY (leader_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: lessons lessons_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learning_admin
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- Name: modules modules_block_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learning_admin
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_block_id_fkey FOREIGN KEY (block_id) REFERENCES public.blocks(id) ON DELETE CASCADE;


--
-- Name: premium_access premium_access_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learning_admin
--

ALTER TABLE ONLY public.premium_access
    ADD CONSTRAINT premium_access_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: premium_access premium_access_block_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learning_admin
--

ALTER TABLE ONLY public.premium_access
    ADD CONSTRAINT premium_access_block_id_fkey FOREIGN KEY (block_id) REFERENCES public.blocks(id) ON DELETE CASCADE;


--
-- Name: premium_access premium_access_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learning_admin
--

ALTER TABLE ONLY public.premium_access
    ADD CONSTRAINT premium_access_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: progress progress_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learning_admin
--

ALTER TABLE ONLY public.progress
    ADD CONSTRAINT progress_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;


--
-- Name: progress progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learning_admin
--

ALTER TABLE ONLY public.progress
    ADD CONSTRAINT progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: quiz_answers quiz_answers_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learning_admin
--

ALTER TABLE ONLY public.quiz_answers
    ADD CONSTRAINT quiz_answers_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;


--
-- Name: quiz_answers quiz_answers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learning_admin
--

ALTER TABLE ONLY public.quiz_answers
    ADD CONSTRAINT quiz_answers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_leader_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: learning_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_leader_id_fkey FOREIGN KEY (leader_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict xS0BvNfwv1NYAWkQXAw0ogYeLtm83gZ5gvdpjdMZcLFxAd7oW7aVTvnUAnOxGLX

--
-- Database "postgres" dump
--

\connect postgres

--
-- PostgreSQL database dump
--

\restrict 7ExcynXfKBLs8f4MAvKoz844frHTmrstWdiclAgZagmDncjuHVbfHt2CZwFBzZI

-- Dumped from database version 15.19
-- Dumped by pg_dump version 15.19

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- PostgreSQL database dump complete
--

\unrestrict 7ExcynXfKBLs8f4MAvKoz844frHTmrstWdiclAgZagmDncjuHVbfHt2CZwFBzZI

--
-- PostgreSQL database cluster dump complete
--

