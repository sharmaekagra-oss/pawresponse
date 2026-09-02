"use client";

import { useState } from "react";
import { saveAddress } from "@/app/address/actions";
import { createClient } from "@/lib/supabase/client";

const onlyLetters = (value: string) => value.replace(/[^a-zA-Z ]/g, "");
const onlyDigits = (value: string) => value.replace(/\D/g, "");

const inputClass =
  "rounded border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-100";

type ServiceStatus = "idle" | "checking" | "available" | "unavailable";

type NominatimAddress = {
  house_number?: string;
  road?: string;
  suburb?: string;
  neighbourhood?: string;
  quarter?: string;
  city?: string;
  town?: string;
  village?: string;
  postcode?: string;
};

export default function AddressCaptureForm({
  defaultStreet = "",
  defaultLocality = "",
  defaultCity = "",
  defaultLandmark = "",
  defaultPincode = "",
  returnTo,
}: {
  defaultStreet?: string;
  defaultLocality?: string;
  defaultCity?: string;
  defaultLandmark?: string;
  defaultPincode?: string;
  returnTo: string;
}) {
  const [street, setStreet] = useState(defaultStreet);
  const [locality, setLocality] = useState(defaultLocality);
  const [city, setCity] = useState(defaultCity);
  const [landmark, setLandmark] = useState(defaultLandmark);
  const [pincode, setPincode] = useState(defaultPincode);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState("");
  const [service, setService] = useState<ServiceStatus>("idle");

  async function checkServiceArea(code: string) {
    setService("checking");
    const supabase = createClient();
    const { data } = await supabase
      .from("service_areas")
      .select("pincode")
      .eq("pincode", code)
      .eq("is_active", true)
      .maybeSingle();
    setService(data ? "available" : "unavailable");
  }

  function handlePincodeChange(value: string) {
    const digits = onlyDigits(value).slice(0, 6);
    setPincode(digits);
    if (digits.length === 6) {
      void checkServiceArea(digits);
    } else {
      setService("idle");
    }
  }

  async function useMyLocation() {
    setLocateError("");
    if (!("geolocation" in navigator)) {
      setLocateError("Geolocation isn't supported by this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // OpenStreetMap's free Nominatim reverse-geocoder — no API key required.
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
            { headers: { Accept: "application/json" } },
          );
          const data: { address?: NominatimAddress } = await res.json();
          const a = data.address ?? {};

          const streetGuess = [a.house_number, a.road].filter(Boolean).join(" ");
          if (streetGuess) setStreet(streetGuess);

          const localityGuess = a.suburb || a.neighbourhood || a.quarter;
          if (localityGuess) setLocality(localityGuess);

          const cityGuess = a.city || a.town || a.village;
          if (cityGuess) setCity(onlyLetters(cityGuess));

          const pin = (a.postcode || "").replace(/\D/g, "").slice(0, 6);
          if (pin.length === 6) {
            setPincode(pin);
            void checkServiceArea(pin);
          }
        } catch {
          setLocateError("Couldn't determine your address from your location.");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocateError("Location permission denied.");
        setLocating(false);
      },
    );
  }

  return (
    <form action={saveAddress} className="flex flex-col gap-4">
      <input type="hidden" name="return_to" value={returnTo} />

      <button
        type="button"
        onClick={useMyLocation}
        disabled={locating}
        className="btn-press flex items-center justify-center gap-2 rounded border border-pink-300 bg-gradient-to-r from-pink-50 to-rose-50 px-3 py-2 font-semibold text-pink-700 hover:from-pink-100 hover:to-rose-100 disabled:opacity-60"
      >
        {locating ? (
          <>
            <span className="animate-pulse-soft">📍</span> Locating...
          </>
        ) : (
          "📍 Use my current location"
        )}
      </button>
      {locateError && <p className="text-sm text-red-600">{locateError}</p>}

      <div className="flex flex-col gap-1">
        <label htmlFor="address_street" className="text-sm text-slate-500">
          Street / House no.
        </label>
        <input
          id="address_street"
          name="address_street"
          type="text"
          required
          maxLength={120}
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          placeholder="12B, Rose Apartments"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="address_locality" className="text-sm text-slate-500">
            Locality / Area
          </label>
          <input
            id="address_locality"
            name="address_locality"
            type="text"
            required
            maxLength={80}
            value={locality}
            onChange={(e) => setLocality(e.target.value)}
            placeholder="Koramangala"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="address_city" className="text-sm text-slate-500">
            City
          </label>
          <input
            id="address_city"
            name="address_city"
            type="text"
            required
            pattern="[a-zA-Z ]+"
            title="Letters only"
            value={city}
            onChange={(e) => setCity(onlyLetters(e.target.value))}
            placeholder="Bengaluru"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="address_landmark" className="text-sm text-slate-500">
            Landmark <span className="text-slate-400">(optional)</span>
          </label>
          <input
            id="address_landmark"
            name="address_landmark"
            type="text"
            maxLength={80}
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            placeholder="Near City Park"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="address_pincode" className="text-sm text-slate-500">
            Pincode
          </label>
          <input
            id="address_pincode"
            name="address_pincode"
            type="text"
            inputMode="numeric"
            required
            minLength={6}
            maxLength={6}
            pattern="[0-9]{6}"
            title="Exactly 6 digits"
            value={pincode}
            onChange={(e) => handlePincodeChange(e.target.value)}
            placeholder="560095"
            className={inputClass}
          />
        </div>
      </div>

      {service === "checking" && (
        <p className="animate-pulse-soft text-sm text-slate-500">
          Checking service availability...
        </p>
      )}
      {service === "available" && (
        <p className="animate-scale-in rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          ✅ We currently serve this area.
        </p>
      )}
      {service === "unavailable" && (
        <p className="animate-scale-in rounded border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
          ⚠️ We don&apos;t currently serve this area yet. You can still save this
          address, but emergency requests won&apos;t be available here.
        </p>
      )}

      <button
        type="submit"
        className="btn-press btn-gradient rounded px-3 py-2 font-semibold text-white"
      >
        Save address
      </button>
    </form>
  );
}
