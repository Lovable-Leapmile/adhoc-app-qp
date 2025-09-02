import { Clock, Package, CheckCircle, XCircle, Eye, MapPin, User } from "lucide-react";
import { Reservation as UIReservation } from "@/types";
import { Button } from "@/components/ui/button";

interface ReservationCardProps {
  // Accept either UI shape or API shape to keep compatibility
  reservation: UIReservation | (UIReservation & any);
  onShowMore?: (reservation: any) => void;
}

export function ReservationCard({ reservation, onShowMore }: ReservationCardProps) {
  const raw: any = reservation as any
  const reservationStatus: string = raw.reservation_status || reservation.status || 'Unknown'
  const podName: string = raw.pod_name || (reservation as any).podName
  const createdByName: string | undefined = raw.created_by_name
  const reservationAwbNo: string | undefined = raw.reservation_awbno
  const locationName: string | undefined = raw.location_name
  const getStatusIcon = () => {
    const normalized = reservationStatus
    switch (normalized) {
      case 'DropPending':
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'PickupPending':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'PickupCompleted':
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'DropCancelled':
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Package className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    if (raw.reservation_status) return raw.reservation_status
    switch (reservation.status) {
      case 'pending': return 'Pending'
      case 'completed': return 'Completed'
      case 'cancelled': return 'Cancelled'
      default: return 'Unknown'
    }
  };

  const getStatusColor = () => {
    switch (reservationStatus) {
      case 'DropPending':
      case 'pending':
        return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'PickupPending':
        return 'text-blue-700 bg-blue-100 border-blue-200';
      case 'PickupCompleted':
      case 'completed':
        return 'text-green-700 bg-green-100 border-green-200';
      case 'DropCancelled':
      case 'cancelled':
        return 'text-red-700 bg-red-100 border-red-200';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  return (
    <div className="card-3d bg-card rounded-2xl p-5 border border-border/50 backdrop-blur-sm animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Package className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground">{podName}</span>
        </div>
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full border text-xs font-medium ${getStatusColor()}`}>
          {getStatusIcon()}
          <span>{getStatusText()}</span>
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        {(reservation.description || raw.package_description) && (
          <p className="text-muted-foreground text-sm">{reservation.description || raw.package_description}</p>
        )}
        
        {/* Additional Details */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {createdByName && (
            <div className="flex items-center space-x-1">
              <User className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">Created by: {createdByName}</span>
            </div>
          )}
          
          {reservationAwbNo && (
            <div className="flex items-center space-x-1">
              <Package className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">AWB: {reservationAwbNo}</span>
            </div>
          )}
          
          {locationName && (
            <div className="flex items-center space-x-1 col-span-2">
              <MapPin className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">Location: {locationName}</span>
            </div>
          )}
          
          {(reservation as any).dropped_at && (
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">Dropped: {new Date((reservation as any).dropped_at).toLocaleDateString()}</span>
            </div>
          )}
          
          {(reservation as any).picked_at && (
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">Picked: {new Date((reservation as any).picked_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted-foreground font-medium">
            {reservation.type?.toUpperCase() || (reservation as any).reservation_type?.toUpperCase()}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(reservation.timestamp || (reservation as any).created_at).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
        
        {onShowMore && (
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => onShowMore(reservation)}
            className="h-6 px-2 bg-yellow-200 text-black hover:bg-yellow-300 hover:text-black"
          >
            <Eye className="w-3 h-3 mr-1" />
            Show More
          </Button>
        )}
      </div>
    </div>
  );
}