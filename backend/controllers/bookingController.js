import Booking from "../models/Booking.js";
import Event from "../models/Event.js";
import Artist from "../models/Artist.js";

const populate = (q) => q.populate('event').populate('artist').populate('requestedBy','name email role');

export async function createBooking(req,res) {
  try {
    if (req.user.role !== 'EVENT_MANAGER') return res.status(403).json({success:false,message:'Only event managers can request bookings'});
    const { eventId, artistId, proposedFee, aiMessage } = req.body;
    const event = await Event.findById(eventId);
    const artist = await Artist.findById(artistId);
    if (!event || !artist) return res.status(404).json({success:false,message:'Event or artist not found'});
    const existing = await Booking.findOne({ event: eventId, artist: artistId, status: { $in: ['REQUESTED','PENDING','ACCEPTED','CONFIRMED'] } });
    if (existing) return res.status(409).json({success:false,message:`A booking already exists for ${artist.stageName} and this event`,booking:await populate(Booking.findById(existing._id))});
    if (Number(proposedFee) > Number(event.budget)) return res.status(400).json({success:false,message:'Proposed fee exceeds the event budget'});
    if (!artist.availability.includes(event.date)) return res.status(409).json({success:false,message:`${artist.stageName} is not available on ${event.date}`});
    const conflict = await Booking.findOne({artist:artistId,status:'CONFIRMED'}).populate('event');
    if (conflict?.event?.date === event.date) return res.status(409).json({success:false,message:`${artist.stageName} is already confirmed for another event on ${event.date}`});
    const booking = await Booking.create({event:eventId,artist:artistId,proposedFee:Number(proposedFee),aiMessage,requestedBy:req.user._id,status:'REQUESTED'});
    await populate(Booking.findById(booking._id)).then(b=>res.status(201).json({success:true,booking:b}));
  } catch(error) {
    if (error.code === 11000) return res.status(409).json({success:false,message:'Duplicate booking: this artist is already requested for this event'});
    res.status(400).json({success:false,message:error.message});
  }
}

export async function getBookings(req,res) {
  try {
    const filter = req.user.role === 'ARTIST' ? {artist:req.user.artist?._id} : {requestedBy:req.user._id};
    const bookings = await populate(Booking.find(filter).sort({createdAt:-1}));
    res.json({success:true,bookings});
  } catch(error){res.status(500).json({success:false,message:error.message});}
}

export async function getAllBookings(req,res){
  const bookings=await populate(Booking.find().sort({createdAt:-1}));
  res.json({success:true,bookings});
}

export async function getBooking(req,res){
  const booking=await populate(Booking.findById(req.params.id));
  if(!booking) return res.status(404).json({success:false,message:'Booking not found'});
  const owns=String(booking.requestedBy?._id)===String(req.user._id) || String(booking.artist?._id)===String(req.user.artist?._id);
  if(!owns && req.user.role!=='EVENT_MANAGER') return res.status(403).json({success:false,message:'Not allowed'});
  res.json({success:true,booking});
}

export async function artistDecision(req,res){
  try{
    if(req.user.role!=='ARTIST') return res.status(403).json({success:false,message:'Artist account required'});
    const booking=await Booking.findById(req.params.id);
    if(!booking || String(booking.artist)!==String(req.user.artist?._id)) return res.status(404).json({success:false,message:'Booking not found'});
    if(!['REQUESTED','PENDING'].includes(booking.status)) return res.status(409).json({success:false,message:`Booking is already ${booking.status}`});
    const {status,artistNote=''}=req.body;
    if(!['ACCEPTED','DECLINED'].includes(status)) return res.status(400).json({success:false,message:'Artist can only accept or decline a pending request'});
    booking.status=status; booking.artistNote=artistNote; booking.artistResponseAt=new Date(); await booking.save();
    const result=await populate(Booking.findById(booking._id)); res.json({success:true,booking:result});
  }catch(error){res.status(500).json({success:false,message:error.message});}
}

export async function managerDecision(req,res){
  try{
    if(req.user.role!=='EVENT_MANAGER') return res.status(403).json({success:false,message:'Event manager account required'});
    const booking=await Booking.findById(req.params.id).populate('event');
    if(!booking || String(booking.requestedBy)!==String(req.user._id)) return res.status(404).json({success:false,message:'Booking not found'});
    if(booking.status!=='ACCEPTED') return res.status(409).json({success:false,message:'Only artist-accepted bookings can be confirmed'});
    const {status}=req.body;
    if(status==='CONFIRMED'){
      const conflict=await Booking.findOne({artist:booking.artist,status:'CONFIRMED',_id:{$ne:booking._id}}).populate('event');
      if(conflict?.event?.date===booking.event.date) return res.status(409).json({success:false,message:'Artist is already confirmed for another event on this date'});
      booking.status='CONFIRMED'; booking.managerDecisionAt=new Date(); await Event.findByIdAndUpdate(booking.event._id,{status:'BOOKED'});
    } else if(status==='DECLINED'){ booking.status='DECLINED'; booking.managerDecisionAt=new Date(); }
    else return res.status(400).json({success:false,message:'Manager can confirm or decline an accepted booking'});
    await booking.save(); const result=await populate(Booking.findById(booking._id)); res.json({success:true,booking:result});
  }catch(error){res.status(500).json({success:false,message:error.message});}
}

export async function artistAvailability(req,res){
  const artist=await Artist.findById(req.params.artistId);
  if(!artist) return res.status(404).json({success:false,message:'Artist not found'});
  const bookings=await Booking.find({artist:artist._id,status:{$in:['REQUESTED','PENDING','ACCEPTED','CONFIRMED']}}).populate('event','title date location');
  const bookedDates=bookings.map(b=>b.event?.date).filter(Boolean);
  res.json({success:true,artist,availableDates:artist.availability.filter(d=>!bookedDates.includes(d)),bookedDates,requests:bookings});
}


export async function cancelBookingByArtist(req, res) {
  try {
    if (req.user.role !== "ARTIST") {
      return res.status(403).json({ success: false, message: "Artist account required" });
    }

    const booking = await Booking.findById(req.params.id).populate("event");
    if (!booking || String(booking.artist) !== String(req.user.artist?._id)) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    if (booking.status !== "CONFIRMED") {
      return res.status(409).json({ success: false, message: "Only confirmed bookings can be cancelled by the artist" });
    }

    const eventStart = new Date(`${booking.event.date}T${booking.event.startTime || "19:00"}:00`);
    const hoursUntilEvent = (eventStart.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntilEvent < 24) {
      return res.status(409).json({ success: false, message: "Artist cancellation is allowed only more than 24 hours before the event" });
    }

    booking.status = "CANCELLED";
    booking.artistNote = req.body.reason || "Cancelled by artist more than 24 hours before the event.";
    booking.artistResponseAt = new Date();
    await booking.save();

    const stillConfirmed = await Booking.exists({ event: booking.event._id, status: "CONFIRMED" });
    if (!stillConfirmed) await Event.findByIdAndUpdate(booking.event._id, { status: "OPEN" });

    const result = await populate(Booking.findById(booking._id));
    res.json({ success: true, booking: result, message: "Booking cancelled successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function managerFeedback(req, res) {
  try {
    if (req.user.role !== "EVENT_MANAGER") {
      return res.status(403).json({ success: false, message: "Event manager account required" });
    }

    const booking = await Booking.findById(req.params.id).populate("event").populate("artist");
    if (!booking || String(booking.requestedBy) !== String(req.user._id)) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    if (booking.status !== "CONFIRMED") {
      return res.status(409).json({ success: false, message: "Feedback can only be submitted for a confirmed booking" });
    }

    const eventStart = new Date(`${booking.event.date}T${booking.event.startTime || "19:00"}:00`);
    if (eventStart > new Date()) {
      return res.status(409).json({ success: false, message: "Feedback is available only after the event has ended" });
    }

    const { rating, feedback = "", tags = [], flagged = false, flagReason = "" } = req.body;
    const numericRating = Number(rating);
    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
    }

    const existing = await ArtistFeedback.findOne({ booking: booking._id });
    if (existing) return res.status(409).json({ success: false, message: "Feedback has already been submitted for this booking" });

    const review = await ArtistFeedback.create({
      artist: booking.artist._id,
      event: booking.event._id,
      booking: booking._id,
      manager: req.user._id,
      rating: numericRating,
      feedback,
      tags: Array.isArray(tags) ? tags : [],
      flagged: Boolean(flagged),
      flagReason: flagged ? flagReason : ""
    });

    const allReviews = await ArtistFeedback.find({ artist: booking.artist._id });
    const average = allReviews.reduce((sum, item) => sum + item.rating, 0) / allReviews.length;
    const allTags = [...new Set(allReviews.flatMap(item => item.tags || []))];

    await Artist.findByIdAndUpdate(booking.artist._id, {
      managerRating: Number(average.toFixed(2)),
      managerReviewCount: allReviews.length,
      managerTags: allTags,
      flagged: Boolean(flagged) || allReviews.some(item => item.flagged),
      flagReason: flagged ? flagReason : ""
    });

    const populated = await ArtistFeedback.findById(review._id)
      .populate("event", "title date")
      .populate("manager", "name");

    res.status(201).json({ success: true, feedback: populated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}
