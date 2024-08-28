import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { differenceInDays } from 'date-fns';
import { toast } from 'react-toastify';

import { useAuth } from '../../../hooks';
import axiosInstance from '@/utils/axios';
import { setupInterceptors } from '@/utils/setupInterceptors';
import DatePickerWithRange from './DatePickerWithRange';

setupInterceptors();
const BookingWidget = ({ place }) => {
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [bookingData, setBookingData] = useState({
    noOfGuests: 1,
    name: '',
    phone: '',
    email: '',
  });
  const [redirect, setRedirect] = useState('');
  const { user } = useAuth();

  const { noOfGuests, name, phone, email } = bookingData;
  const { placeId: id, price } = place;

  useEffect(() => {
    if (user) {
      setBookingData({ ...bookingData, name: user.name });
    }
  }, [user]);

  const numberOfNights =
    dateRange.from && dateRange.to
      ? differenceInDays(
          new Date(dateRange.to).setHours(0, 0, 0, 0),
          new Date(dateRange.from).setHours(0, 0, 0, 0),
        )
      : 0;

  // handle booking form
  const handleBookingData = (e) => {
    setBookingData({
      ...bookingData,
      [e.target.name]: e.target.value,
    });
  };

  const handleBooking = async () => {
    // User must be signed in to book place
    if (!user) {
      return setRedirect(`/login`);
    }

    // BOOKING DATA VALIDATION
    if (numberOfNights < 1) {
      return toast.error('Please select valid dates');
    } else if (noOfGuests < 1) {
      return toast.error("No. of guests can't be less than 1");
    } else if (noOfGuests > place.maxGuests) {
      return toast.error(`Allowed max. no. of guests: ${place.maxGuests}`);
    } else if (name.trim() === '') {
      return toast.error("Name can't be empty");
    } else if (phone.trim() === '') {
      return toast.error("Phone can't be empty");
    } else if (email.trim() === '') {
      return toast.error("Email can't be empty");
    }

    try {
      const checkInDate = new Date(dateRange.from);
      const checkOutDate = new Date(dateRange.to);
      const userId = JSON.parse(localStorage.user).userId;
      const response = await axiosInstance.post(
        'https://588cr4cfe7.execute-api.us-east-1.amazonaws.com/RoomBookings/RoomBookingSQS',
        {
          checkIn: checkInDate,
          checkOut: checkOutDate,
          name: name,
          numberOfGuests: noOfGuests,
          phone: phone,
          placeId: id,
          price: numberOfNights * price,
          userId: userId,
          email: email,
        },
      );

      toast('Congratulations! Enjoy your trip.');
      setRedirect(`/`);
    } catch (error) {
      toast.error('Something went wrong!');
      console.log('Error: ', error);
    }
  };

  if (redirect) {
    return <Navigate to={redirect} />;
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-xl">
      <div className="text-center text-xl">
        Price: <span className="font-semibold">${place.price}</span> / per night
      </div>
      <div className="mt-4 rounded-2xl border">
        <div className="flex w-full ">
          <DatePickerWithRange setDateRange={setDateRange} />
        </div>
        <div className="border-t px-4 py-3">
          <label>Number of guests: </label>
          <input
            type="number"
            name="noOfGuests"
            placeholder={`Max. guests: ${place.maxGuests}`}
            min={1}
            max={place.maxGuests}
            value={noOfGuests}
            onChange={handleBookingData}
          />
        </div>
        <div className="border-t px-4 py-3">
          <label>Your full name: </label>
          <input
            type="text"
            name="name"
            value={name}
            onChange={handleBookingData}
          />
          <label>Phone number: </label>
          <input
            type="tel"
            name="phone"
            value={phone}
            onChange={handleBookingData}
          />
          <label>email: </label>
          <input
            type="text"
            name="email"
            value={email}
            onChange={handleBookingData}
          />
        </div>
      </div>
      <button onClick={handleBooking} className="primary mt-4">
        Book this place
        {numberOfNights > 0 && <span> ${numberOfNights * place.price}</span>}
      </button>
    </div>
  );
};

export default BookingWidget;
