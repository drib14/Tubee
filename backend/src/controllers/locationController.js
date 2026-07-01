import axios from 'axios';

export const reverseGeocode = async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ message: 'Latitude (lat) and longitude (lon) are required' });
  }

  const token = process.env.LOCATIONIQ_ACCESS_TOKEN;

  try {
    const response = await axios.get(
      `https://us1.locationiq.com/v1/reverse.php`,
      {
        params: {
          key: token,
          lat,
          lon,
          format: 'json'
        }
      }
    );

    const address = response.data.address;
    const city = address.city || address.town || address.village || address.suburb || '';
    const country = address.country || '';
    
    let formattedLocation = '';
    if (city && country) {
      formattedLocation = `${city}, ${country}`;
    } else {
      formattedLocation = country || city || 'Unknown Location';
    }

    res.status(200).json({ 
      locationName: formattedLocation,
      addressDetails: address
    });
  } catch (error) {
    console.error('LocationIQ geocoding error:', error.message);
    res.status(500).json({ 
      message: 'Failed to reverse geocode coordinates', 
      error: error.message,
      fallbackLocation: 'Aesthetic Coffee Shop'
    });
  }
};
