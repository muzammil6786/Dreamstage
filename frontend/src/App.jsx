import { useEffect, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Compass,
  LogOut,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Star,
  TicketCheck,
  UserCheck,
  Users,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Pencil,
  Trash2,
  Flag,
  MessageSquare,
  ShieldCheck,
  Music,
  Mic2,
  Disc3,
  Building2,
  Handshake,
  BadgeCheck,
  Menu,
  X,
  Home as HomeIcon,
} from "lucide-react";

import api from "./api";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const fmtDate = (d) =>
  d
    ? new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const eventDateTime = (e) =>
  new Date(`${e?.date || "1970-01-01"}T${e?.startTime || "19:00"}:00`);

const isPastEvent = (e) => eventDateTime(e) <= new Date();

const EVENT_TYPES = [
  "Music Event",
  "Stand-up Comedy",
  "Open Mic",
  "Clubbing / DJ",
  "Celebrity Appearance",
  "Corporate Event",
  "Wedding",
  "Festival",
  "Other",
];

/* =========================================================
   APP
========================================================= */

function App() {
  /*
    IMPORTANT:
    We restore the logged-in user from localStorage.
  */
  const savedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("ds_user") || "null");
    } catch {
      return null;
    }
  })();

  /*
    These are pages that are safe to restore after refresh.

    We intentionally DO NOT persist:
    create
    editEvent
    eventDetails
    matches
    artist

    because those pages depend on selectedEvent / selectedArtist.
    If we restored those pages without their selected objects,
    the page could become blank after refresh.
  */
  const persistentPages = [
    "dashboard",
    "events",
    "artists",
    "bookings",
    "profile",
  ];

  const [user, setUser] = useState(savedUser);

  const [page, setPage] = useState(() => {
    if (!savedUser) {
      return "home";
    }

    const savedPage = localStorage.getItem("ds_page");

    if (persistentPages.includes(savedPage)) {
      return savedPage;
    }

    return "dashboard";
  });

  const [artists, setArtists] = useState([]);
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [matches, setMatches] = useState([]);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [eventDetails, setEventDetails] = useState(null);

  const [bookingMessageText, setBookingMessageText] = useState("");
  const [availability, setAvailability] = useState(null);

  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);

  const [authMode, setAuthMode] = useState("login");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* =========================================================
     LOAD DATA
  ========================================================= */

  const load = async () => {
    if (!user) {
      return;
    }

    try {
      const [a, e, b] = await Promise.all([
        api.get("/artists"),
        api.get("/events"),
        api.get("/bookings"),
      ]);

      setArtists(a.data.artists || []);
      setEvents(e.data.events || []);
      setBookings(b.data.bookings || []);
    } catch (e) {
      if (e.response?.status === 401) {
        logout();
      } else {
        setToast(
          e.response?.data?.message || "Could not load workspace",
        );
      }
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  /* =========================================================
     SAVE CURRENT PAGE
  ========================================================= */

  useEffect(() => {
    if (!user) {
      return;
    }

    if (persistentPages.includes(page)) {
      localStorage.setItem("ds_page", page);
    }
  }, [page, user]);

  /* =========================================================
     TOAST
  ========================================================= */

  useEffect(() => {
    if (!toast) {
      return;
    }

    const t = setTimeout(() => {
      setToast("");
    }, 3500);

    return () => clearTimeout(t);
  }, [toast]);

  /* =========================================================
     NAVIGATION
  ========================================================= */

  const navigate = (nextPage) => {
    setPage(nextPage);
    setMobileMenuOpen(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =========================================================
     LOGOUT
  ========================================================= */

  const logout = () => {
    localStorage.removeItem("ds_token");
    localStorage.removeItem("ds_user");
    localStorage.removeItem("ds_page");

    setUser(null);
    setPage("home");
    setMobileMenuOpen(false);
  };

  /* =========================================================
     LOGIN
  ========================================================= */

  const login = (u) => {
    localStorage.setItem("ds_user", JSON.stringify(u));
    localStorage.setItem("ds_page", "dashboard");

    setUser(u);
    setPage("dashboard");
    setMobileMenuOpen(false);
  };

  /* =========================================================
     PUBLIC AREA
  ========================================================= */

  if (!user) {
    if (page === "auth") {
      return (
        <Auth
          mode={authMode}
          setMode={setAuthMode}
          onLogin={login}
          onHome={() => setPage("home")}
        />
      );
    }

    return (
      <Home
        onLogin={() => {
          setAuthMode("login");
          setPage("auth");
        }}
        onRegister={() => {
          setAuthMode("register");
          setPage("auth");
        }}
      />
    );
  }

  /* =========================================================
     ROLE
  ========================================================= */

  const isArtist = user.role === "ARTIST";

  const nav = isArtist
    ? [
        ["dashboard", "Overview"],
        ["bookings", "My Requests"],
        ["profile", "My Profile"],
      ]
    : [
        ["dashboard", "Overview"],
        ["events", "Events"],
        ["artists", "Discover Artists"],
        ["bookings", "Bookings"],
      ];

  /* =========================================================
     EVENT DETAILS
  ========================================================= */

  const openEventDetails = async (e) => {
    setSelectedEvent(e);
    setEventDetails(null);
    setPage("eventDetails");
    setMobileMenuOpen(false);
    setLoading(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    try {
      const r = await api.get(`/events/${e._id}`);
      setEventDetails(r.data);
    } catch (err) {
      setToast(
        err.response?.data?.message ||
          "Could not load event details",
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     AI MATCH
  ========================================================= */

  const match = async (e) => {
    setSelectedEvent(e);
    setMatches([]);
    setPage("matches");
    setMobileMenuOpen(false);
    setLoading(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    try {
      const r = await api.post("/ai/match-artists", {
        eventId: e._id,
      });

      setMatches(r.data.matches || []);
    } catch (err) {
      setToast(
        err.response?.data?.message ||
          "Matching service unavailable",
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     OPEN ARTIST
  ========================================================= */

  const openArtist = async (a) => {
    setSelectedArtist(a);
    setAvailability(null);
    setBookingMessageText("");
    setPage("artist");
    setMobileMenuOpen(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    try {
      const r = await api.get(
        `/bookings/artist/${a._id}/availability`,
      );

      setAvailability(r.data);
    } catch {
      setToast("Could not load artist availability");
    }
  };

  /* =========================================================
     CREATE BOOKING
  ========================================================= */

  const request = async () => {
    if (!selectedEvent || !selectedArtist) {
      return;
    }

    setLoading(true);

    try {
      await api.post("/bookings", {
        eventId: selectedEvent._id,
        artistId: selectedArtist._id,
        proposedFee: selectedArtist.fee,
        aiMessage:
          bookingMessageText.trim() ||
          `Booking request for ${selectedEvent.title}`,
      });

      setToast(
        "Booking request sent — waiting for artist response.",
      );

      await load();

      navigate("bookings");
    } catch (e) {
      setToast(
        e.response?.data?.message ||
          "Could not create booking",
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     BOOKING DECISION
  ========================================================= */

  const decide = async (id, status, manager = false) => {
    try {
      await api.patch(
        `/bookings/${id}/${
          manager ? "manager-decision" : "artist-decision"
        }`,
        {
          status,
        },
      );

      setToast(
        status === "CONFIRMED"
          ? "Booking confirmed!"
          : `Booking ${status.toLowerCase()}.`,
      );

      await load();
    } catch (e) {
      setToast(
        e.response?.data?.message ||
          "Could not update booking",
      );
    }
  };

  /* =========================================================
     CANCEL BOOKING
  ========================================================= */

  const cancelBooking = async (id) => {
    if (
      !window.confirm(
        "Cancel this confirmed performance? Artists can cancel only more than 24 hours before the event.",
      )
    ) {
      return;
    }

    try {
      await api.patch(`/bookings/${id}/cancel`, {
        reason: "Cancelled by artist",
      });

      setToast("Performance cancelled successfully.");

      await load();
    } catch (e) {
      setToast(
        e.response?.data?.message ||
          "Could not cancel performance",
      );
    }
  };

  /* =========================================================
     DELETE EVENT
  ========================================================= */

  const removeEvent = async (id) => {
    if (
      !window.confirm(
        "Remove this event? Open and accepted booking requests will be closed.",
      )
    ) {
      return;
    }

    try {
      await api.delete(`/events/${id}`);

      setToast("Event removed successfully.");

      await load();

      navigate("events");
    } catch (e) {
      setToast(
        e.response?.data?.message ||
          "Could not remove event",
      );
    }
  };

  /* =========================================================
     UPDATE ARTIST PROFILE
  ========================================================= */

  const updateProfile = async (form) => {
    try {
      const r = await api.patch("/artists/me", form);

      const nextUser = {
        ...user,
        artist: r.data.artist,
      };

      localStorage.setItem(
        "ds_user",
        JSON.stringify(nextUser),
      );

      setUser(nextUser);

      setToast("Artist profile updated.");

      navigate("profile");
    } catch (e) {
      setToast(
        e.response?.data?.message ||
          "Could not update profile",
      );
    }
  };

  /* =========================================================
     FEEDBACK
  ========================================================= */

  const submitFeedback = async (id, data) => {
    try {
      await api.post(`/bookings/${id}/feedback`, data);

      setToast("Artist feedback saved.");

      await load();
    } catch (e) {
      setToast(
        e.response?.data?.message ||
          "Could not save feedback",
      );
    }
  };

  /* =========================================================
     AUTHENTICATED APP
  ========================================================= */

  return (
    <div className="app">
      {/* MOBILE OVERLAY */}
      {mobileMenuOpen && (
        <div
          className="sidebarOverlay"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`sidebar ${
          mobileMenuOpen ? "mobileOpen" : ""
        }`}
      >
        <div className="logo">
          <div className="logoMark">
            <Sparkles />
          </div>

          <div>
            <b>Dreamstage</b>
            <small>Talent OS</small>
          </div>
        </div>

        <div className="userCard">
          <div className="userAvatar">
            {user.name?.slice(0, 2).toUpperCase()}
          </div>

          <div>
            <b>{user.name}</b>
            <small>
              {isArtist ? "Artist" : "Event Manager"}
            </small>
          </div>

          <ShieldCheck size={16} />
        </div>

        <nav>
          {nav.map(([id, label]) => (
            <button
              type="button"
              className={page === id ? "active" : ""}
              onClick={() => navigate(id)}
              key={id}
            >
              {id === "dashboard" ? (
                <Compass />
              ) : id === "events" ? (
                <CalendarDays />
              ) : id === "artists" ? (
                <Users />
              ) : id === "bookings" ? (
                <TicketCheck />
              ) : (
                <UserCheck />
              )}

              {label}

              {id === "bookings" &&
                bookings.filter((b) =>
                  [
                    "REQUESTED",
                    "PENDING",
                    "ACCEPTED",
                  ].includes(b.status),
                ).length > 0 && (
                  <em>
                    {
                      bookings.filter((b) =>
                        [
                          "REQUESTED",
                          "PENDING",
                          "ACCEPTED",
                        ].includes(b.status),
                      ).length
                    }
                  </em>
                )}
            </button>
          ))}
        </nav>

        <div className="sidebarBottom">
          <div className="live">
            <span /> AI engine online
          </div>

          <button
            type="button"
            className="logout"
            onClick={logout}
          >
            <LogOut /> Sign out
          </button>
        </div>
      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main>
        <header>
          {/* MOBILE HAMBURGER */}
          <button
            type="button"
            className="mobileMenuButton"
            onClick={() =>
              setMobileMenuOpen((prev) => !prev)
            }
            aria-label={
              mobileMenuOpen
                ? "Close navigation menu"
                : "Open navigation menu"
            }
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X size={24} />
            ) : (
              <Menu size={24} />
            )}
          </button>

          <div className="breadcrumb">
            <span className="crumb">Dream Stage</span>

            <ChevronRight size={14} />

            <strong>
              {nav.find((n) => n[0] === page)?.[1] ||
                (page === "eventDetails"
                  ? "Event Details"
                  : page === "matches"
                    ? "AI Shortlist"
                    : page === "artist"
                      ? "Artist Profile"
                      : page === "create"
                        ? "Create Event"
                        : page === "editEvent"
                          ? "Edit Event"
                          : page)}
            </strong>
          </div>

          <div className="topUser">
            {user.name}

            <div className="tinyAvatar">
              {user.name?.slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        {/* =================================================
            CONTENT
        ================================================= */}

        <section className="content">
          {page === "dashboard" && (
            <Dashboard
              user={user}
              events={events}
              artists={artists}
              bookings={bookings}
              onMatch={match}
              onCreate={() => navigate("create")}
            />
          )}

          {page === "events" && (
            <Events
              events={events}
              onMatch={match}
              onDetails={openEventDetails}
              onCreate={() => navigate("create")}
              onEdit={(e) => {
                setSelectedEvent(e);
                setPage("editEvent");

                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });
              }}
              onDelete={removeEvent}
            />
          )}

          {page === "create" && (
            <EventForm
              onDone={async (e) => {
                await load();

                setSelectedEvent(e);

                match(e);
              }}
              onCancel={() => navigate("events")}
            />
          )}

          {page === "editEvent" && (
            <EventForm
              event={selectedEvent}
              onDone={async (e) => {
                await load();

                setSelectedEvent(e);

                navigate("events");
              }}
              onCancel={() => navigate("events")}
            />
          )}

          {page === "eventDetails" && (
            <EventDetails
              data={eventDetails}
              loading={loading}
              onBack={() => navigate("events")}
              onMatch={match}
            />
          )}

          {page === "matches" && (
            <Matches
              event={selectedEvent}
              matches={matches}
              loading={loading}
              onArtist={openArtist}
              onBack={() => navigate("events")}
            />
          )}

          {page === "artist" && (
            <Artist
              artist={selectedArtist}
              availability={availability}
              event={selectedEvent}
              message={bookingMessageText}
              setMessage={setBookingMessageText}
              onBack={() => setPage("matches")}
              onRequest={request}
              loading={loading}
            />
          )}

          {page === "artists" && (
            <Artists
              artists={artists}
              onArtist={openArtist}
            />
          )}

          {page === "bookings" && (
            <Bookings
              bookings={bookings}
              isArtist={isArtist}
              onDecision={decide}
              onCancel={cancelBooking}
              onFeedback={submitFeedback}
            />
          )}

          {page === "profile" && (
            <Profile
              user={user}
              artist={user.artist}
              onSave={updateProfile}
            />
          )}
        </section>
      </main>

      {/* =====================================================
          TOAST
      ===================================================== */}

      {toast && (
        <div className="toast">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   PUBLIC HOME
========================================================= */

function Home({ onLogin, onRegister }) {
  return (
    <div className="publicHome">
      <nav className="publicNav">
        <div className="logo">
          <div className="logoMark">
            <Sparkles size={20} />
          </div>

          <div>
            <b>Dreamstage</b>
            <small>Artist × Event Network</small>
          </div>
        </div>

        <div className="publicLinks">
          <a href="#how-it-works">How It Works</a>
          <a href="#artists">For Artists</a>
          <a href="#managers">For Managers</a>
          <a href="#genres">Genres</a>
          <a href="#about">About</a>
        </div>

        <div className="publicActions">
          <button
            type="button"
            className="secondary"
            onClick={onLogin}
          >
            Sign in
          </button>

          <button
            type="button"
            className="primary"
            onClick={onRegister}
          >
            Join Dream Stage
          </button>
        </div>
      </nav>

      <section className="publicHero">
        <div className="heroContent">
          <span className="eyebrow">
            <Sparkles size={16} />
            INDIA'S ARTIST × EVENT NETWORK
          </span>

          <h1>
            Your stage is waiting.
            <br />
            <span>Let's find it.</span>
          </h1>

          <p className="heroDescription">
            Dream Stage connects talented artists with event
            organisers, venues, brands, companies and hosts across
            India. Build your profile, discover opportunities and
            make the right connection without the chaos.
          </p>

          <div className="publicCtas">
            <button
              type="button"
              className="primary large"
              onClick={onRegister}
            >
              Join as an Artist
              <ArrowRight size={18} />
            </button>

            <button
              type="button"
              className="secondary large"
              onClick={onRegister}
            >
              Find Artists for My Event
            </button>
          </div>

          <div className="heroTrust">
            <div>
              <CheckCircle2 />
              <span>Verified profiles</span>
            </div>

            <div>
              <CheckCircle2 />
              <span>Clear booking workflow</span>
            </div>

            <div>
              <CheckCircle2 />
              <span>Built for both sides</span>
            </div>
          </div>
        </div>

        <div className="publicVisual">
          <div className="visualGlow"></div>

          <div className="artistMainCard">
            <div className="artistAvatar">
              <Music size={30} />
            </div>

            <div>
              <span>Artist Profile</span>
              <h3>Available for Events</h3>
              <small>Mumbai · India</small>
            </div>

            <BadgeCheck className="verifiedIcon" />
          </div>

          <div className="floatingCard bookingCard">
            <div className="miniIcon">
              <CalendarDays size={18} />
            </div>

            <div>
              <b>Live Event</b>
              <span>Artist booked successfully</span>
            </div>

            <CheckCircle2 />
          </div>

          <div className="floatingCard matchCard">
            <div className="matchIcon">
              <Sparkles size={18} />
            </div>

            <div>
              <b>AI Artist Match</b>
              <span>94% match found</span>
            </div>
          </div>

          <div className="floatingCard locationCard">
            <MapPin size={17} />
            <span>Events across India</span>
          </div>
        </div>
      </section>

      <section className="publicStats">
        <div>
          <strong>500+</strong>
          <span>Artist Profiles</span>
        </div>

        <div>
          <strong>100+</strong>
          <span>Events Listed</span>
        </div>

        <div>
          <strong>20+</strong>
          <span>Genres</span>
        </div>

        <div>
          <strong>10+</strong>
          <span>Major Cities</span>
        </div>
      </section>

      <section
        className="publicSection introSection"
        id="about"
      >
        <div className="sectionHeading">
          <span className="eyebrow">
            ONE PLATFORM. TWO SIDES.
          </span>

          <h2>
            We bring the right people
            <br />
            <span>together.</span>
          </h2>

          <p>
            Finding the right artist for an event shouldn't mean
            endless calls, scattered WhatsApp messages and
            uncertainty. Dream Stage creates a structured space
            where artists and event managers can discover,
            communicate and manage bookings.
          </p>
        </div>

        <div className="connectionVisual">
          <div className="connectionBox">
            <Users />
            <strong>Artists</strong>
            <span>Talent & creativity</span>
          </div>

          <div className="connectionLine">
            <Handshake />
          </div>

          <div className="connectionBox">
            <CalendarDays />
            <strong>Events</strong>
            <span>Opportunities & stages</span>
          </div>
        </div>
      </section>

      <section
        className="publicSection howSection"
        id="how-it-works"
      >
        <div className="centerHeading">
          <span className="eyebrow">HOW IT WORKS</span>

          <h2>
            From discovery to
            <br />
            <span>the final performance.</span>
          </h2>

          <p>
            A simple, transparent workflow designed to keep both
            artists and event managers on the same page.
          </p>
        </div>

        <div className="stepsGrid">
          <div className="stepCard">
            <div className="stepNumber">01</div>
            <Search />

            <h3>Discover</h3>

            <p>
              Managers create an event and discover artists based
              on genre, location, experience, budget and event
              requirements.
            </p>
          </div>

          <div className="stepCard">
            <div className="stepNumber">02</div>
            <MessageSquare />

            <h3>Connect</h3>

            <p>
              Send a booking request along with a personalised
              message explaining exactly what you need from the
              artist.
            </p>
          </div>

          <div className="stepCard">
            <div className="stepNumber">03</div>
            <CheckCircle2 />

            <h3>Confirm</h3>

            <p>
              Artists can accept or decline. Managers can then
              confirm the booking and keep the entire booking state
              organised.
            </p>
          </div>

          <div className="stepCard">
            <div className="stepNumber">04</div>
            <Star />

            <h3>Perform & Grow</h3>

            <p>
              After the event, managers can leave ratings,
              feedback and professional tags to build
              accountability and trust.
            </p>
          </div>
        </div>
      </section>

      <section
        className="publicSection splitSection"
        id="artists"
      >
        <div className="splitContent">
          <span className="eyebrow">FOR ARTISTS</span>

          <h2>
            Turn your talent
            <br />
            into <span>opportunities.</span>
          </h2>

          <p>
            Whether you're a musician, DJ, comedian, performer,
            speaker or entertainer, Dream Stage gives you a
            professional presence where event organisers can
            discover you.
          </p>

          <div className="featureList">
            <div>
              <CheckCircle2 />
              <span>
                Create your professional artist profile
              </span>
            </div>

            <div>
              <CheckCircle2 />
              <span>
                Add your bio, genres, city and experience
              </span>
            </div>

            <div>
              <CheckCircle2 />
              <span>
                Set your expected fee and availability
              </span>
            </div>

            <div>
              <CheckCircle2 />
              <span>
                Receive and manage event requests
              </span>
            </div>

            <div>
              <CheckCircle2 />
              <span>
                Build your reputation through feedback
              </span>
            </div>
          </div>

          <button
            type="button"
            className="primary"
            onClick={onRegister}
          >
            Create Artist Profile
            <ArrowRight size={18} />
          </button>
        </div>

        <div className="featureVisual artistFeatureVisual">
          <div className="profilePreview">
            <div className="profileTop">
              <div className="profileAvatar">
                <Music />
              </div>

              <div>
                <b>Featured Artist</b>
                <span>Verified Artist</span>
              </div>

              <BadgeCheck />
            </div>

            <div className="profileTags">
              <span>Bollywood</span>
              <span>Live Music</span>
              <span>Acoustic</span>
            </div>

            <div className="profileStats">
              <div>
                <strong>4.9</strong>
                <span>Rating</span>
              </div>

              <div>
                <strong>38</strong>
                <span>Events</span>
              </div>

              <div>
                <strong>8</strong>
                <span>Cities</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="publicSection splitSection reverse"
        id="managers"
      >
        <div className="splitContent">
          <span className="eyebrow">
            FOR EVENT MANAGERS
          </span>

          <h2>
            Build your event.
            <br />
            Find the <span>right talent.</span>
          </h2>

          <p>
            Create events, shortlist artists, send personalised
            booking requests and manage every artist from one
            organised dashboard.
          </p>

          <div className="featureList">
            <div>
              <CheckCircle2 />
              <span>
                Create events across multiple categories
              </span>
            </div>

            <div>
              <CheckCircle2 />
              <span>
                Search artists by genre and requirements
              </span>
            </div>

            <div>
              <CheckCircle2 />
              <span>
                Use AI-powered artist shortlisting
              </span>
            </div>

            <div>
              <CheckCircle2 />
              <span>
                Send personalised booking requirements
              </span>
            </div>

            <div>
              <CheckCircle2 />
              <span>
                Manage accepted, declined and pending requests
              </span>
            </div>
          </div>

          <button
            type="button"
            className="primary"
            onClick={onRegister}
          >
            Create an Event
            <ArrowRight size={18} />
          </button>
        </div>

        <div className="featureVisual managerFeatureVisual">
          <div className="eventDashboard">
            <div className="dashboardHeader">
              <div>
                <span>Upcoming Event</span>
                <h3>Summer Music Night</h3>
              </div>

              <CalendarDays />
            </div>

            <div className="eventDetails">
              <span>
                <MapPin size={15} /> Mumbai
              </span>

              <span>
                <Users size={15} /> 4 Artists
              </span>
            </div>

            <div className="bookingRows">
              <div>
                <div className="rowAvatar">
                  <Music size={14} />
                </div>

                <span>Live Music Artist</span>

                <b className="accepted">Accepted</b>
              </div>

              <div>
                <div className="rowAvatar">
                  <Disc3 size={14} />
                </div>

                <span>DJ Performance</span>

                <b className="pending">Pending</b>
              </div>

              <div>
                <div className="rowAvatar">
                  <Mic2 size={14} />
                </div>

                <span>MC / Host</span>

                <b className="accepted">Accepted</b>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="publicSection genresSection"
        id="genres"
      >
        <div className="centerHeading">
          <span className="eyebrow">
            DISCOVER TALENT
          </span>

          <h2>
            One platform.
            <br />
            <span>Every kind of stage.</span>
          </h2>

          <p>
            From intimate open mics to large-scale celebrations,
            discover talent across multiple genres and event
            formats.
          </p>
        </div>

        <div className="genreGrid">
          <div>
            <Music />
            <h3>Live Music</h3>
            <span>
              Acoustic · Bollywood · Rock · Indie
            </span>
          </div>

          <div>
            <Disc3 />
            <h3>DJ & Clubbing</h3>
            <span>
              House · EDM · Techno · Commercial
            </span>
          </div>

          <div>
            <Mic2 />
            <h3>Stand-up Comedy</h3>
            <span>
              Comedians · Hosts · Performers
            </span>
          </div>

          <div>
            <Sparkles />
            <h3>Open Mic</h3>
            <span>
              Poetry · Spoken Word · Music
            </span>
          </div>

          <div>
            <Building2 />
            <h3>Corporate</h3>
            <span>
              Speakers · Hosts · Entertainment
            </span>
          </div>

          <div>
            <Star />
            <h3>Celebrity Events</h3>
            <span>
              Appearances · Guests · Brand Events
            </span>
          </div>
        </div>
      </section>

      <section className="trustSection">
        <div className="trustContent">
          <div className="trustIcon">
            <ShieldCheck size={32} />
          </div>

          <div>
            <span className="eyebrow">
              A NEUTRAL THIRD-PARTY LAYER
            </span>

            <h2>
              Connections built on
              <br />
              <span>clarity and trust.</span>
            </h2>

            <p>
              Dream Stage is designed to keep communication,
              requests, approvals and booking decisions structured
              between artists and event managers. Neither side has
              to navigate the entire process alone.
            </p>
          </div>
        </div>

        <div className="trustPoints">
          <div>
            <ShieldCheck />
            <strong>Transparent</strong>
            <span>Clear booking states</span>
          </div>

          <div>
            <MessageSquare />
            <strong>Direct</strong>
            <span>Personalised requirements</span>
          </div>

          <div>
            <BadgeCheck />
            <strong>Accountable</strong>
            <span>Ratings & feedback</span>
          </div>

          <div>
            <Handshake />
            <strong>Neutral</strong>
            <span>Built for both parties</span>
          </div>
        </div>
      </section>

      <section className="publicSection indiaSection">
        <div className="centerHeading">
          <span className="eyebrow">
            FROM CITY TO CITY
          </span>

          <h2>
            Opportunities don't stop
            <br />
            at <span>one city.</span>
          </h2>

          <p>
            Dream Stage is designed to connect artists and events
            happening across India's major entertainment and
            business destinations.
          </p>
        </div>

        <div className="cityGrid">
          <span>Mumbai</span>
          <span>Delhi</span>
          <span>Bengaluru</span>
          <span>Pune</span>
          <span>Hyderabad</span>
          <span>Goa</span>
          <span>Chennai</span>
          <span>Kolkata</span>
          <span>Ahmedabad</span>
          <span>Jaipur</span>
        </div>
      </section>

      <section className="finalCta">
        <div className="finalCtaGlow"></div>

        <Sparkles size={28} />

        <h2>
          Your next event.
          <br />
          <span>Your next opportunity.</span>
        </h2>

        <p>
          Join Dream Stage and become part of India's growing
          artist × event network.
        </p>

        <div className="finalCtaButtons">
          <button
            type="button"
            className="primary large"
            onClick={onRegister}
          >
            Join Dream Stage
            <ArrowRight size={18} />
          </button>

          <button
            type="button"
            className="secondary large"
            onClick={onLogin}
          >
            Already a member? Sign in
          </button>
        </div>
      </section>

      <footer className="publicFooter">
        <div className="footerBrand">
          <div className="logoMark">
            <Sparkles size={18} />
          </div>

          <div>
            <b>Dreamstage</b>
            <span>Artist × Event Network</span>
          </div>
        </div>

        <div className="footerLinks">
          <a href="#how-it-works">How It Works</a>
          <a href="#artists">Artists</a>
          <a href="#managers">Event Managers</a>
          <a href="#genres">Genres</a>
          <a href="#about">About</a>
        </div>

        <div className="footerBottom">
          <span>
            Dream Stage · Connecting talent and events across India
          </span>

          <span>
            © {new Date().getFullYear()} Dream Stage
          </span>
        </div>
      </footer>
    </div>
  );
}

/* =========================================================
   AUTH
========================================================= */

function Auth({ mode, setMode, onLogin, onHome }) {
  const [form, setForm] = useState({
    name: "",
    email: "manager@dreamstage.com",
    password: "password123",
    role: "EVENT_MANAGER",
    stageName: "",
    location: "",
    bio: "",
    genres: "",
    experience: 1,
    fee: 0,
    availability: "",
  });

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    setBusy(true);
    setError("");

    try {
      const payload = { ...form };

      if (form.role === "ARTIST") {
        payload.genres = form.genres
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);

        payload.availability = form.availability
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);

        payload.experience = Number(form.experience);
        payload.fee = Number(form.fee);
      }

      const r = await api.post(`/auth/${mode}`, payload);

      localStorage.setItem(
        "ds_token",
        r.data.token,
      );

      localStorage.setItem(
        "ds_user",
        JSON.stringify(r.data.user),
      );

      localStorage.setItem("ds_page", "dashboard");

      onLogin(r.data.user);
    } catch (e) {
      setError(
        e.response?.data?.message ||
          "Authentication failed",
      );
    } finally {
      setBusy(false);
    }
  };

  const ch = (e) =>
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

  return (
    <div className="auth">
      <div className="authGlow one" />
      <div className="authGlow two" />

      <div className="authCard">
        <button
          type="button"
          className="backHome"
          onClick={onHome}
        >
          <HomeIcon /> Dream Stage home
        </button>

        <div className="authBrand">
          <div className="logoMark">
            <Sparkles />
          </div>

          <b>Dreamstage</b>
        </div>

        <div className="authIntro">
          <span>
            {mode === "login"
              ? "WELCOME BACK"
              : "JOIN THE NETWORK"}
          </span>

          <h1>
            {mode === "login"
              ? "Welcome back."
              : "Create your talent profile."}
          </h1>

          <p>
            {mode === "login"
              ? "Manage opportunities, events and bookings in one place."
              : "Artists can join directly and build a profile. Event managers can start creating events and discovering talent."}
          </p>
        </div>

        <form onSubmit={submit}>
          {mode === "register" && (
            <label>
              Full name

              <input
                required
                name="name"
                value={form.name}
                onChange={ch}
                placeholder="Your name"
              />
            </label>
          )}

          <label>
            Email

            <input
              required
              type="email"
              name="email"
              value={form.email}
              onChange={ch}
            />
          </label>

          <label>
            Password

            <input
              required
              minLength="6"
              type="password"
              name="password"
              value={form.password}
              onChange={ch}
            />
          </label>

          {mode === "register" && (
            <>
              <label>
                Account type

                <select
                  name="role"
                  value={form.role}
                  onChange={ch}
                >
                  <option value="EVENT_MANAGER">
                    Event Manager
                  </option>

                  <option value="ARTIST">
                    Artist
                  </option>
                </select>
              </label>

              {form.role === "ARTIST" && (
                <>
                  <label>
                    Stage name

                    <input
                      required
                      name="stageName"
                      value={form.stageName}
                      onChange={ch}
                      placeholder="How audiences know you"
                    />
                  </label>

                  <label>
                    City

                    <input
                      required
                      name="location"
                      value={form.location}
                      onChange={ch}
                      placeholder="Mumbai, Delhi, Bengaluru..."
                    />
                  </label>

                  <label>
                    Genres

                    <input
                      name="genres"
                      value={form.genres}
                      onChange={ch}
                      placeholder="Comedy, Open Mic, Stand-up"
                    />
                  </label>

                  <label>
                    Short bio

                    <textarea
                      name="bio"
                      value={form.bio}
                      onChange={ch}
                      placeholder="Tell organisers about your act..."
                    />
                  </label>

                  <div className="formGrid">
                    <label>
                      Experience (years)

                      <input
                        type="number"
                        min="0"
                        name="experience"
                        value={form.experience}
                        onChange={ch}
                      />
                    </label>

                    <label>
                      Starting fee (₹)

                      <input
                        type="number"
                        min="0"
                        name="fee"
                        value={form.fee}
                        onChange={ch}
                      />
                    </label>
                  </div>

                  <label>
                    Availability dates

                    <input
                      name="availability"
                      value={form.availability}
                      onChange={ch}
                      placeholder="2026-09-15, 2026-09-20"
                    />
                  </label>
                </>
              )}
            </>
          )}

          {error && (
            <div className="error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="authBtn"
          >
            {busy
              ? "Please wait…"
              : mode === "login"
                ? "Sign in"
                : "Create account"}

            <ArrowRight size={17} />
          </button>
        </form>

        <div className="switch">
          {mode === "login"
            ? "New to Dream Stage?"
            : "Already have an account?"}{" "}

          <button
            type="button"
            onClick={() =>
              setMode(
                mode === "login"
                  ? "register"
                  : "login",
              )
            }
          >
            {mode === "login"
              ? "Create account"
              : "Sign in"}
          </button>
        </div>

        <div className="demo">
          <b>Demo accounts</b>
          <span>
            Manager: manager@dreamstage.com / password123
          </span>
          <span>
            Artist: arjun@dreamstage.com / password123
          </span>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard({
  user,
  events,
  artists,
  bookings,
  onMatch,
  onCreate,
}) {
  const pending = bookings.filter((b) =>
    ["REQUESTED", "PENDING"].includes(b.status),
  ).length;

  const accepted = bookings.filter(
    (b) => b.status === "ACCEPTED",
  ).length;

  const confirmed = bookings.filter(
    (b) => b.status === "CONFIRMED",
  ).length;

  return (
    <>
      <PageHeader
        title={
          user.role === "ARTIST"
            ? "Your performance inbox"
            : "Build your next unforgettable event"
        }
        desc={
          user.role === "ARTIST"
            ? "Review incoming opportunities and keep your profile ready for new bookings."
            : "Discover talent across India, manage your event brief and keep every booking decision clear."
        }
        action={
          user.role === "EVENT_MANAGER" && (
            <button
              type="button"
              className="primary"
              onClick={onCreate}
            >
              <Plus /> New event
            </button>
          )
        }
      />

      <div className="hero">
        <div>
          <div className="eyebrow">
            <Sparkles /> AI TALENT MATCHING
          </div>

          <h2>
            Right artist.
            <br />
            <span>Right moment.</span>
          </h2>

          <p>
            Match by genre, location, budget, rating and
            availability — then let both sides approve before a
            booking is confirmed.
          </p>

          {events[0] &&
            user.role === "EVENT_MANAGER" && (
              <button
                type="button"
                className="heroBtn"
                onClick={() => onMatch(events[0])}
              >
                Match {events[0].title}
                <ArrowRight />
              </button>
            )}
        </div>

        <div className="heroVisual">
          <div className="ring r1" />
          <div className="ring r2" />

          <div className="centerSpark">
            <Sparkles />
          </div>

          <div className="floatChip chip1">
            India-wide talent
          </div>

          <div className="floatChip chip2">
            <Check /> verified workflow
          </div>
        </div>
      </div>

      <div className="stats">
        <Stat
          title="Open events"
          value={events.length}
          icon={CalendarDays}
        />

        <Stat
          title="Artists"
          value={artists.length}
          icon={Users}
        />

        <Stat
          title="Awaiting response"
          value={pending + accepted}
          icon={Clock3}
        />

        <Stat
          title="Confirmed"
          value={confirmed}
          icon={CheckCircle2}
        />
      </div>

      <div className="grid2">
        <div className="panel">
          <PanelTitle title="Upcoming events" />

          {events.slice(0, 4).map((e) => (
            <div
              className="eventRow"
              key={e._id}
            >
              <div className="dateBox">
                <b>
                  {new Date(
                    `${e.date}T00:00`,
                  ).getDate()}
                </b>

                <span>
                  {new Date(
                    `${e.date}T00:00`,
                  )
                    .toLocaleDateString("en", {
                      month: "short",
                    })
                    .toUpperCase()}
                </span>
              </div>

              <div className="grow">
                <b>{e.title}</b>

                <small>
                  <MapPin /> {e.location} · {e.genre} ·{" "}
                  {e.type}
                </small>
              </div>

              <strong>{money(e.budget)}</strong>

              {user.role === "EVENT_MANAGER" && (
                <button
                  type="button"
                  className="round"
                  onClick={() => onMatch(e)}
                >
                  <ArrowRight />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="panel">
          <PanelTitle
            title={
              user.role === "ARTIST"
                ? "Latest requests"
                : "Booking pipeline"
            }
          />

          {bookings.length ? (
            bookings
              .slice(0, 5)
              .map((b) => (
                <BookingLine
                  b={b}
                  key={b._id}
                />
              ))
          ) : (
            <Empty />
          )}
        </div>
      </div>
    </>
  );
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function Stat({ title, value, icon: Icon }) {
  return (
    <div className="stat">
      <div className="statIcon">
        <Icon />
      </div>

      <b>{value}</b>
      <span>{title}</span>
    </div>
  );
}

function PageHeader({ title, desc, action }) {
  return (
    <div className="pageHeader">
      <div>
        <span className="eyebrow">
          DREAM STAGE
        </span>

        <h1>{title}</h1>
        <p>{desc}</p>
      </div>

      {action}
    </div>
  );
}

function PanelTitle({ title }) {
  return (
    <div className="panelTitle">
      <h3>{title}</h3>
      <span>Live workspace</span>
    </div>
  );
}

function Status({ s }) {
  return (
    <span className={`status ${s.toLowerCase()}`}>
      {s}
    </span>
  );
}

function BookingLine({ b }) {
  return (
    <div className="bookingLine">
      <img src={b.artist?.avatar} />

      <div className="grow">
        <b>{b.artist?.stageName}</b>

        <small>
          {b.event?.title} ·{" "}
          {fmtDate(b.event?.date)}
        </small>
      </div>

      <Status s={b.status} />
    </div>
  );
}

function Empty() {
  return (
    <div className="empty">
      <TicketCheck />

      <b>No bookings yet</b>

      <span>
        Your booking activity will appear here.
      </span>
    </div>
  );
}

/* =========================================================
   EVENTS
========================================================= */

function Events({
  events,
  onMatch,
  onDetails,
  onCreate,
  onEdit,
  onDelete,
}) {
  return (
    <>
      <PageHeader
        title="Events"
        desc="Create event briefs, edit details when plans change, and remove events you no longer need."
        action={
          <button
            type="button"
            className="primary"
            onClick={onCreate}
          >
            <Plus /> New event
          </button>
        }
      />

      <div className="cards">
        {events.map((e) => (
          <div
            className="eventCard"
            key={e._id}
          >
            <div className="cover">
              <Sparkles />
              <Status s={e.status} />
            </div>

            <div className="cardBody">
              <span className="type">
                {e.type}
              </span>

              <h3>{e.title}</h3>

              <div className="meta">
                <span>
                  <CalendarDays />
                  {fmtDate(e.date)} ·{" "}
                  {e.startTime || "19:00"}
                </span>

                <span>
                  <MapPin />
                  {e.location}
                </span>

                <span>
                  <CircleDollarSign />
                  {money(e.budget)}
                </span>

                <span>
                  <TicketCheck />
                  {e.genre}
                </span>
              </div>

              <div className="cardActions">
                <button
                  type="button"
                  className="secondary"
                  onClick={() =>
                    onDetails(e)
                  }
                >
                  <TicketCheck /> Details
                </button>

                <button
                  type="button"
                  className="secondary"
                  onClick={() => onEdit(e)}
                >
                  <Pencil /> Edit
                </button>

                <button
                  type="button"
                  className="danger"
                  onClick={() =>
                    onDelete(e._id)
                  }
                >
                  <Trash2 /> Remove
                </button>
              </div>

              <button
                type="button"
                className="primary wide"
                onClick={() => onMatch(e)}
              >
                <Sparkles /> Find artists
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* =========================================================
   EVENT DETAILS
========================================================= */

function EventDetails({
  data,
  loading,
  onBack,
  onMatch,
}) {
  if (loading) {
    return (
      <div className="loading">
        <RefreshCw className="spin" />

        <b>
          Loading event details…
        </b>

        <span>
          Checking every artist booking and its
          current state.
        </span>
      </div>
    );
  }

  if (!data?.event) {
    return (
      <>
        <button
          type="button"
          className="back"
          onClick={onBack}
        >
          ← Back to events
        </button>

        <Empty />
      </>
    );
  }

  const {
    event,
    bookings = [],
    bookingSummary = {},
  } = data;

  return (
    <>
      <PageHeader
        title={event.title}
        desc={`${fmtDate(event.date)} · ${
          event.startTime || "19:00"
        } · ${event.location} · ${event.genre}`}
        action={
          <button
            type="button"
            className="secondary"
            onClick={onBack}
          >
            Back to events
          </button>
        }
      />

      <div className="detailHero panel">
        <div>
          <span className="eyebrow">
            EVENT DETAILS
          </span>

          <h2>{event.type}</h2>

          <p>
            {event.description ||
              "No additional event description."}
          </p>
        </div>

        <div className="requestMeta">
          <span>
            <CalendarDays />{" "}
            {fmtDate(event.date)} ·{" "}
            {event.startTime || "19:00"}
          </span>

          <span>
            <MapPin /> {event.location}
          </span>

          <span>
            <CircleDollarSign />{" "}
            {money(event.budget)}
          </span>

          <span>
            <Clock /> {event.duration}
          </span>
        </div>
      </div>

      <div className="stats">
        <Stat
          title="Total bookings"
          value={bookingSummary.total || 0}
          icon={TicketCheck}
        />

        <Stat
          title="Requested"
          value={bookingSummary.requested || 0}
          icon={Clock3}
        />

        <Stat
          title="Accepted"
          value={bookingSummary.accepted || 0}
          icon={CheckCircle2}
        />

        <Stat
          title="Confirmed artists"
          value={bookingSummary.confirmed || 0}
          icon={Users}
        />
      </div>

      <div className="panel">
        <PanelTitle title="Artists booked / requested for this event" />

        {bookings.length ? (
          <div className="bookingDetailList">
            {bookings.map((b) => (
              <div
                className="bookingDetail"
                key={b._id}
              >
                <img src={b.artist?.avatar} />

                <div className="grow">
                  <b>
                    {b.artist?.stageName}
                  </b>

                  <small>
                    {b.artist?.genres?.join(
                      " · ",
                    )}
                  </small>

                  <p>
                    {b.aiMessage ||
                      "No message provided."}
                  </p>
                </div>

                <div>
                  <Status s={b.status} />

                  <small>
                    {money(b.proposedFee)}
                  </small>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty />
        )}

        <div className="actions">
          <button
            type="button"
            className="primary"
            onClick={() => onMatch(event)}
          >
            <Sparkles /> Find more artists
          </button>
        </div>
      </div>
    </>
  );
}

/* =========================================================
   EVENT FORM
========================================================= */

function EventForm({
  event,
  onDone,
  onCancel,
}) {
  const [f, setF] = useState({
    title: event?.title || "",
    type: event?.type || "Music Event",
    location: event?.location || "",
    date: event?.date || "2026-09-15",
    startTime: event?.startTime || "19:00",
    budget: event?.budget || "50000",
    genre: event?.genre || "",
    duration:
      event?.duration || "2 hours",
    description:
      event?.description || "",
  });

  const [busy, setBusy] = useState(false);

  const ch = (e) =>
    setF({
      ...f,
      [e.target.name]: e.target.value,
    });

  const sub = async (e) => {
    e.preventDefault();

    setBusy(true);

    try {
      const payload = {
        ...f,
        budget: Number(f.budget),
      };

      const r = event
        ? await api.patch(
            `/events/${event._id}`,
            payload,
          )
        : await api.post(
            "/events",
            payload,
          );

      await onDone(r.data.event);
    } catch (e) {
      alert(
        e.response?.data?.message ||
          "Could not save event",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title={
          event
            ? "Edit event"
            : "Create event"
        }
        desc={
          event
            ? "Change the date, time, genre, budget, location or any other event detail."
            : "Add enough context for better artist matching."
        }
      />

      <form
        className="form"
        onSubmit={sub}
      >
        <div className="formGrid">
          <label>
            Event name

            <input
              required
              name="title"
              value={f.title}
              onChange={ch}
            />
          </label>

          <label>
            Event type

            <select
              name="type"
              value={f.type}
              onChange={ch}
            >
              {EVENT_TYPES.map((x) => (
                <option key={x}>
                  {x}
                </option>
              ))}
            </select>
          </label>

          <label>
            Location

            <input
              required
              name="location"
              value={f.location}
              onChange={ch}
              placeholder="Mumbai"
            />
          </label>

          <label>
            Date

            <input
              required
              type="date"
              name="date"
              value={f.date}
              onChange={ch}
            />
          </label>

          <label>
            Start time

            <input
              required
              type="time"
              name="startTime"
              value={f.startTime}
              onChange={ch}
            />
          </label>

          <label>
            Budget (₹)

            <input
              required
              type="number"
              min="0"
              name="budget"
              value={f.budget}
              onChange={ch}
            />
          </label>

          <label>
            Genre

            <input
              required
              name="genre"
              value={f.genre}
              onChange={ch}
              placeholder="Stand-up, Open Mic, House, Bollywood..."
            />
          </label>

          <label>
            Duration

            <input
              name="duration"
              value={f.duration}
              onChange={ch}
            />
          </label>
        </div>

        <label>
          Description

          <textarea
            name="description"
            value={f.description}
            onChange={ch}
          />
        </label>

        <div className="actions">
          <button
            type="button"
            className="secondary"
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="primary"
          >
            {busy
              ? "Saving…"
              : event
                ? "Save event changes"
                : "Create & match artists"}

            <Sparkles />
          </button>
        </div>
      </form>
    </>
  );
}

/* =========================================================
   MATCHES
========================================================= */

function Matches({
  event,
  matches,
  loading,
  onArtist,
  onBack,
}) {
  return (
    <>
      <PageHeader
        title="AI shortlist"
        desc={
          event
            ? `${event.title} · ${fmtDate(
                event.date,
              )} · ${event.location} · ${
                event.genre
              } · ${money(event.budget)}`
            : ""
        }
        action={
          <button
            type="button"
            className="secondary"
            onClick={onBack}
          >
            Back to events
          </button>
        }
      />

      <div className="aiBar">
        <div className="aiIcon">
          <Sparkles />
        </div>

        <div>
          <b>Dream Stage AI</b>

          <span>
            Matching genre, location, budget
            and live availability
          </span>
        </div>

        <div className="aiLive">
          <i /> LIVE
        </div>
      </div>

      <br />
      <br />
     <br />

      {loading ? (
        <div className="loading">
          <RefreshCw className="spin" />

          <b>
            Finding your best performers…
          </b>

          <span>
            Comparing fit and availability.
          </span>
        </div>
      ) : (
        <div className="matchGrid">
          {matches.map((m, i) => (
            <div
              className="matchCard"
              key={m.artist._id}
              onClick={() =>
                onArtist(m.artist)
              }
            >
              <div className="rank">
                0{i + 1}
              </div>

              <img src={m.artist.avatar} />

              <div className="matchInfo">
                <b>
                  {m.artist.stageName}
                </b>

                <span>
                  <MapPin />
                  {m.artist.location} ·{" "}
                  {m.artist.genres
                    .slice(0, 2)
                    .join(" · ")}
                </span>

                <span>
                  <Star />{" "}
                  {m.artist.rating} (
                  {m.artist.reviews}) ·{" "}
                  {money(m.artist.fee)}
                </span>
              </div>

              <div className="score">
                <strong>
                  {m.matchScore}%
                </strong>

                <span>match</span>
              </div>

              <p>{m.reason}</p>

              <button
                type="button"
                className="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onArtist(m.artist);
                }}
              >
                View availability{" "}
                <ArrowRight />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* =========================================================
   ARTIST
========================================================= */

function Artist({
  artist,
  availability,
  event,
  message,
  setMessage,
  onBack,
  onRequest,
  loading,
}) {
  if (!artist) {
    return null;
  }

  const available = event
    ? availability?.availableDates?.includes(
        event.date,
      )
    : false;

  return (
    <>
      <button
        type="button"
        className="back"
        onClick={onBack}
      >
        ← Back to matches
      </button>

      <div className="artistHero">
        <img src={artist.avatar} />

        <div>
          <span className="eyebrow">
            ARTIST PROFILE
          </span>

          <h1>{artist.stageName}</h1>

          <p>{artist.bio}</p>

          <div className="pills">
            {artist.genres.map((g) => (
              <span key={g}>{g}</span>
            ))}
          </div>

          {artist.managerTags?.length >
            0 && (
            <div className="tagrow profileTags">
              {artist.managerTags.map(
                (t) => (
                  <span key={t}>
                    Manager tag: {t}
                  </span>
                ),
              )}
            </div>
          )}

          {artist.flagged && (
            <div className="flagNotice">
              <Flag /> This profile has a
              manager flag on record.
            </div>
          )}
        </div>

        <div className="rating">
          <Star />

          <b>{artist.rating}</b>

          <span>
            {artist.reviews} public reviews
          </span>
        </div>
      </div>

      <div className="grid2 detailGrid">
        <div className="panel">
          <PanelTitle title="Availability" />

          <div className="availability">
            <b>
              Available performance dates
            </b>

            {availability
              ?.availableDates?.length ? (
              availability.availableDates.map(
                (d) => (
                  <span key={d}>
                    <CheckCircle2 />{" "}
                    {fmtDate(d)}
                  </span>
                ),
              )
            ) : (
              <small>
                No available dates returned.
              </small>
            )}
          </div>

          <div className="booked">
            <Clock /> Active requests hold
            dates. Confirmed bookings block
            the date.
          </div>
        </div>

        <div className="panel requestPanel">
          <span className="eyebrow">
            BOOKING REQUEST
          </span>

          <h2>
            {event
              ? event.title
              : "Select an event"}
          </h2>

          {event ? (
            <>
              <div className="requestMeta">
                <span>
                  <CalendarDays />
                  {fmtDate(event.date)} ·{" "}
                  {event.startTime ||
                    "19:00"}
                </span>

                <span>
                  <MapPin />
                  {event.location}
                </span>

                <span>
                  <CircleDollarSign />
                  {money(artist.fee)}
                </span>
              </div>

              <div
                className={
                  available
                    ? "available"
                    : "unavailable"
                }
              >
                {available ? (
                  <>
                    <CheckCircle2 /> Available
                    for this event date
                  </>
                ) : (
                  <>
                    <XCircle /> Not available
                    for this event date
                  </>
                )}
              </div>

              <label className="messageBox">
                <span>
                  Your message to the artist
                </span>

                <textarea
                  value={message}
                  onChange={(e) =>
                    setMessage(
                      e.target.value,
                    )
                  }
                  placeholder="Write your specific requirements: set length, performance style, arrival time, special requests, guest appearance details, payment expectations, etc."
                  rows="5"
                />
              </label>

              <button
                type="button"
                className="primary wide"
                disabled={
                  !available || loading
                }
                onClick={onRequest}
              >
                {loading
                  ? "Sending…"
                  : "Send booking request"}

                <ArrowRight />
              </button>

              <small>
                Your message is saved with the
                booking request. Artist
                accepts/declines first; you then
                confirm an accepted booking.
              </small>
            </>
          ) : (
            <p>
              Choose an event before
              requesting this artist.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

/* =========================================================
   ARTISTS
========================================================= */

function Artists({
  artists,
  onArtist,
}) {
  const [q, setQ] = useState("");

  const list = artists.filter((a) =>
    (
      a.stageName +
      " " +
      a.location +
      " " +
      a.genres.join(" ")
    )
      .toLowerCase()
      .includes(q.toLowerCase()),
  );

  return (
    <>
      <PageHeader
        title="Discover artists"
        desc="Explore profiles, genres, fees, availability and manager feedback signals."
      />

      <div className="search">
        <Search />

        <input
          placeholder="Search artist, genre or city…"
          value={q}
          onChange={(e) =>
            setQ(e.target.value)
          }
        />
      </div>

      <div className="artistGrid">
        {list.map((a) => (
          <div
            className="artistCard"
            key={a._id}
          >
            <img src={a.avatar} />

            <div className="artistCardBody">
              <h3>{a.stageName}</h3>

              <span>
                <MapPin /> {a.location}
              </span>

              <div className="ratingLine">
                <Star /> {a.rating} ·{" "}
                {a.reviews} reviews
              </div>

              <p>{a.bio}</p>

              <div className="tagrow">
                {a.genres
                  .slice(0, 3)
                  .map((g) => (
                    <span key={g}>
                      {g}
                    </span>
                  ))}
              </div>

              {a.flagged && (
                <div className="flagNotice small">
                  <Flag /> Manager flag
                </div>
              )}

              <div className="artistFoot">
                <b>{money(a.fee)}</b>

                <button
                  type="button"
                  className="outline"
                  onClick={() =>
                    onArtist(a)
                  }
                >
                  Profile <ArrowRight />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* =========================================================
   BOOKINGS
========================================================= */

function Bookings({
  bookings,
  isArtist,
  onDecision,
  onCancel,
  onFeedback,
}) {
  return (
    <>
      <PageHeader
        title={
          isArtist
            ? "My booking requests"
            : "Booking control center"
        }
        desc={
          isArtist
            ? "Accept or decline opportunities. A confirmed performance can be cancelled only more than 24 hours before the event."
            : "Artist acceptance and manager confirmation keep both sides in the loop. Submit feedback after completed events."
        }
      />

      <div className="workflow">
        <div>
          <b>01</b>
          <span>Request</span>
        </div>

        <ArrowRight />

        <div>
          <b>02</b>
          <span>Artist accepts</span>
        </div>

        <ArrowRight />

        <div>
          <b>03</b>
          <span>Manager confirms</span>
        </div>

        <ArrowRight />

        <div>
          <b>04</b>
          <span>Confirmed</span>
        </div>
      </div>

      <div className="bookingTable">
        <div className="tableHead">
          <span>Artist / Event</span>
          <span>Date</span>
          <span>Fee</span>
          <span>Status</span>
          <span>Action</span>
        </div>

        {bookings.length ? (
          bookings.map((b) => (
            <BookingRow
              key={b._id}
              b={b}
              isArtist={isArtist}
              onDecision={onDecision}
              onCancel={onCancel}
              onFeedback={onFeedback}
            />
          ))
        ) : (
          <Empty />
        )}
      </div>
    </>
  );
}

/* =========================================================
   BOOKING ROW
========================================================= */

function BookingRow({
  b,
  isArtist,
  onDecision,
  onCancel,
  onFeedback,
}) {
  const past = isPastEvent(b.event);

  const [showFeedback, setShowFeedback] =
    useState(false);

  const [f, setF] = useState({
    rating: 5,
    feedback: "",
    tags: "",
    flagged: false,
    flagReason: "",
  });

  const send = async (e) => {
    e.preventDefault();

    await onFeedback(b._id, {
      ...f,
      rating: Number(f.rating),
      tags: f.tags
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
    });

    setShowFeedback(false);
  };

  return (
    <div className="tableRow">
      <div className="person">
        <img src={b.artist?.avatar} />

        <div style={{ fontSize: "1.05rem" }}>
          <b>
            {b.artist?.stageName}
          </b>

          <small style={{ fontSize: "0.95rem" }}>
            {b.event?.title}
          </small>

          {isArtist &&
            ["REQUESTED", "PENDING"].includes(
              b.status,
            ) && (
              <div className="bookingRequestDetails">
                <small>
                  <MapPin /> {b.event?.location || "Location not specified"}
                </small>

                <small
                  className="bookingMessage"
                  style={{
                    display: "block",
                    fontSize: "0.82rem",
                    lineHeight: 1.5,
                    marginTop: "0.35rem",
                    color: "#000",
                  }}
                >
                  <b>Message from Event Manager</b>
                  <span
                    style={{
                      display: "block",
                      marginTop: "0.2rem",
                      fontSize: "0.9rem",
                      color: "#020202"
                    }}
                  >
                    {b.aiMessage || "No custom message"}
                  </span>
                </small>
              </div>
            )}

          {(!isArtist ||
            !["REQUESTED", "PENDING"].includes(b.status)) && (
            <small className="bookingMessage" style={{ fontSize: "0.95rem", color: "#020202" }}>
              {b.aiMessage || "No custom message"}
            </small>
          )}
        </div>
      </div>

      <span>
        {fmtDate(b.event?.date)}

        <small>
          {b.event?.startTime ||
            "19:00"}
        </small>
      </span>

      <b>
        <small>Proposed fee</small>
        {money(b.proposedFee)}
      </b>

      <Status s={b.status} />

      <div className="rowActions">
        {isArtist &&
          ["REQUESTED", "PENDING"].includes(
            b.status,
          ) && (
            <>
              <button
                type="button"
                className="accept"
                onClick={() =>
                  onDecision(
                    b._id,
                    "ACCEPTED",
                  )
                }
              >
                Accept
              </button>

              <button
                type="button"
                className="decline"
                onClick={() =>
                  onDecision(
                    b._id,
                    "DECLINED",
                  )
                }
              >
                Decline
              </button>
            </>
          )}

        {isArtist &&
          b.status === "CONFIRMED" && (
            <button
              type="button"
              className="decline"
              onClick={() =>
                onCancel(b._id)
              }
            >
              Cancel performance
            </button>
          )}

        {!isArtist &&
          b.status === "ACCEPTED" && (
            <>
              <button
                type="button"
                className="accept"
                onClick={() =>
                  onDecision(
                    b._id,
                    "CONFIRMED",
                    true,
                  )
                }
              >
                Confirm
              </button>

              <button
                type="button"
                className="decline"
                onClick={() =>
                  onDecision(
                    b._id,
                    "DECLINED",
                    true,
                  )
                }
              >
                Decline
              </button>
            </>
          )}

        {!isArtist &&
          b.status === "CONFIRMED" &&
          past && (
            <button
              type="button"
              className="feedbackBtn"
              onClick={() =>
                setShowFeedback(
                  !showFeedback,
                )
              }
            >
              <MessageSquare /> Feedback
            </button>
          )}

        {["DECLINED"].includes(
          b.status,
        ) && (
          <span className="muted">
            Closed
          </span>
        )}

        {["REQUESTED", "PENDING"].includes(
          b.status,
        ) &&
          !isArtist && (
            <span className="muted">
              Waiting for artist
            </span>
          )}
      </div>

      {showFeedback && (
        <form
          className="feedbackForm"
          onSubmit={send}
        >
          <b>
            Post-event feedback ·{" "}
            {b.artist?.stageName}
          </b>

          <label>
            Rating

            <select
              value={f.rating}
              onChange={(e) =>
                setF({
                  ...f,
                  rating:
                    e.target.value,
                })
              }
            >
              {[1, 2, 3, 4, 5].map(
                (n) => (
                  <option key={n}>
                    {n}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            Feedback

            <textarea
              value={f.feedback}
              onChange={(e) =>
                setF({
                  ...f,
                  feedback:
                    e.target.value,
                })
              }
              placeholder="How was the artist's performance?"
            />
          </label>

          <label>
            Tags

            <input
              value={f.tags}
              onChange={(e) =>
                setF({
                  ...f,
                  tags: e.target.value,
                })
              }
              placeholder="Professional, Punctual, Great crowd..."
            />
          </label>

          <label className="checkLabel">
            <input
              type="checkbox"
              checked={f.flagged}
              onChange={(e) =>
                setF({
                  ...f,
                  flagged:
                    e.target.checked,
                })
              }
            />{" "}
            Flag artist for manager review
          </label>

          {f.flagged && (
            <label>
              Flag reason

              <input
                value={f.flagReason}
                onChange={(e) =>
                  setF({
                    ...f,
                    flagReason:
                      e.target.value,
                  })
                }
                required
              />
            </label>
          )}

          <div className="actions">
            <button
              type="button"
              className="secondary"
              onClick={() =>
                setShowFeedback(false)
              }
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary"
            >
              Save feedback
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/* =========================================================
   PROFILE
========================================================= */

function Profile({
  user,
  artist,
  onSave,
}) {
  const [editing, setEditing] =
    useState(false);

  const [f, setF] = useState({
    name:
      artist?.name || user.name,
    stageName:
      artist?.stageName || "",
    avatar:
      artist?.avatar || "",
    genres: (
      artist?.genres || []
    ).join(", "),
    location:
      artist?.location || "",
    bio:
      artist?.bio || "",
    experience:
      artist?.experience || 0,
    fee:
      artist?.fee || 0,
    tags: (
      artist?.tags || []
    ).join(", "),
    availability: (
      artist?.availability || []
    ).join(", "),
  });

  const ch = (e) =>
    setF({
      ...f,
      [e.target.name]:
        e.target.value,
    });

  if (editing) {
    return (
      <>
        <PageHeader
          title="Edit artist profile"
          desc="Keep your bio, genres, fee and availability current so organisers can find the right fit."
        />

        <form className="form">
          <div className="formGrid">
            <label>
              Name

              <input
                name="name"
                value={f.name}
                onChange={ch}
                required
              />
            </label>

            <label>
              Stage name

              <input
                name="stageName"
                value={f.stageName}
                onChange={ch}
                required
              />
            </label>

            <label>
              City

              <input
                name="location"
                value={f.location}
                onChange={ch}
                required
              />
            </label>

            <label>
              Avatar URL

              <input
                name="avatar"
                value={f.avatar}
                onChange={ch}
              />
            </label>

            <label>
              Experience

              <input
                type="number"
                min="0"
                name="experience"
                value={f.experience}
                onChange={ch}
              />
            </label>

            <label>
              Fee (₹)

              <input
                type="number"
                min="0"
                name="fee"
                value={f.fee}
                onChange={ch}
              />
            </label>
          </div>

          <label>
            Genres

            <input
              name="genres"
              value={f.genres}
              onChange={ch}
            />
          </label>

          <label>
            Bio

            <textarea
              name="bio"
              value={f.bio}
              onChange={ch}
            />
          </label>

          <label>
            Profile tags

            <input
              name="tags"
              value={f.tags}
              onChange={ch}
            />
          </label>

          <label>
            Availability dates

            <input
              name="availability"
              value={f.availability}
              onChange={ch}
              placeholder="2026-09-15, 2026-09-20"
            />
          </label>

          <div className="actions">
            <button
              type="button"
              className="secondary"
              onClick={() =>
                setEditing(false)
              }
            >
              Cancel
            </button>

            <button
              type="button"
              className="primary"
              onClick={() =>
                onSave({
                  ...f,

                  genres: f.genres
                    .split(",")
                    .map((x) =>
                      x.trim(),
                    )
                    .filter(Boolean),

                  tags: f.tags
                    .split(",")
                    .map((x) =>
                      x.trim(),
                    )
                    .filter(Boolean),

                  availability:
                    f.availability
                      .split(",")
                      .map((x) =>
                        x.trim(),
                      )
                      .filter(Boolean),

                  experience:
                    Number(
                      f.experience,
                    ),

                  fee: Number(f.fee),
                })
              }
            >
              Save profile
            </button>
          </div>
        </form>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Your profile"
        desc="Your artist identity and performance profile. Keep it updated for better opportunities."
        action={
          <button
            type="button"
            className="primary"
            onClick={() =>
              setEditing(true)
            }
          >
            <Pencil /> Edit profile
          </button>
        }
      />

      <div className="profilePanel">
        <img src={artist?.avatar} />

        <div>
          <span className="eyebrow">
            ARTIST PROFILE
          </span>

          <h1>
            {artist?.stageName ||
              user.name}
          </h1>

          <p>
            {artist?.bio ||
              "Add a bio so event managers understand your act."}
          </p>

          {artist && (
            <>
              <div className="pills">
                {artist.genres?.map(
                  (g) => (
                    <span key={g}>
                      {g}
                    </span>
                  ),
                )}
              </div>

              <div className="profileStats">
                <span>
                  <Star />{" "}
                  {artist.rating}
                </span>

                <span>
                  <CircleDollarSign />{" "}
                  {money(artist.fee)}
                </span>

                <span>
                  <MapPin />{" "}
                  {artist.location}
                </span>

                <span>
                  <Clock />{" "}
                  {artist.experience} yrs
                </span>
              </div>

              {artist.managerRating >
                0 && (
                <div className="managerReview">
                  <b>
                    Manager rating:{" "}
                    {artist.managerRating}/5
                  </b>

                  <span>
                    {
                      artist.managerReviewCount
                    }{" "}
                    completed manager
                    review(s)
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default App;