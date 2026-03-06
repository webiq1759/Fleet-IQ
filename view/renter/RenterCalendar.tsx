import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { Booking } from '../../types';
import { BookingsCalendar } from '../../components/BookingsCalendar';

export const RenterCalendar = () => {
    const [trips, setTrips] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchTrips();
    }, []);

    const fetchTrips = async () => {
        try {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setTrips([]);
                return;
            }

            const { data, error } = await supabase
                .from('bookings')
                .select(`
                *,
                assets (
                  title,
                  image_url,
                  owner_id
                ),
                crew_members (*)
              `)
                .eq('client_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                const ownerIds = [...new Set(data.map((b: any) => b.assets?.owner_id).filter(Boolean))];
                let ownersMap: Record<string, any> = {};

                if (ownerIds.length > 0) {
                    const { data: owners } = await supabase
                        .from('profiles')
                        .select('id, full_name, avatar_url')
                        .in('id', ownerIds);

                    if (owners) {
                        ownersMap = owners.reduce((acc: any, owner: any) => {
                            acc[owner.id] = owner;
                            return acc;
                        }, {});
                    }
                }

                const mappedTrips: Booking[] = data.map((b: any) => {
                    const assetOwnerId = b.assets?.owner_id;
                    const ownerProfile = assetOwnerId ? ownersMap[assetOwnerId] : null;

                    const crewDataRaw = Array.isArray(b.crew_members) ? b.crew_members[0] : b.crew_members;
                    const crew = crewDataRaw ? {
                        name: crewDataRaw.name || crewDataRaw.full_name || 'Driver',
                        phone: crewDataRaw.phone || crewDataRaw.phone_number || '',
                        photo: crewDataRaw.photo || crewDataRaw.photo_url || crewDataRaw.avatar_url || null
                    } : undefined;

                    return {
                        id: b.id,
                        bookingCode: b.booking_code,
                        clientId: b.client_id,
                        clientName: user.user_metadata?.full_name || 'Me',
                        crew: crew,
                        assetId: b.asset_id,
                        assetTitle: b.assets?.title || 'Unknown Asset',
                        assetImage: b.assets?.image_url || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80',
                        pickupDate: b.start_date || b.pickup_date,
                        pickupTime: b.pickup_time,
                        pickupLocation: b.pickup_location,
                        dropoffLocation: b.dropoff_location,
                        returnDate: b.end_date || b.return_date,
                        totalAmount: Number(b.total_amount),
                        paymentStatus: b.payment_status || 'Pending',
                        status: b.status || 'New',
                        requestedOn: new Date(b.created_at).toISOString().split('T')[0],
                        guests: b.guest_count || b.metadata?.guests || 1,
                        owner: ownerProfile ? {
                            id: ownerProfile.id,
                            name: ownerProfile.full_name || 'Fleet Owner',
                            avatar_url: ownerProfile.avatar_url
                        } : undefined
                    };
                });

                setTrips(mappedTrips);
            }
        } catch (error) {
            console.error('Error fetching renter trips for calendar:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-red-600" />
            </div>
        );
    }

    return <BookingsCalendar bookings={trips} viewMode="renter" />;
};
