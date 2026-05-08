import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Rider, RiderDocument, VehicleType } from './rider.schema';
import { PssClientService } from '../pss-client/pss-client.service';

export interface CreateRiderDto {
  user_id: string;
  cnic: string;
  vehicle_type: VehicleType;
  license_plate: string;
  availability_zone: string;
}

export interface UpdateRiderDto {
  vehicle_type?: VehicleType;
  license_plate?: string;
  availability_zone?: string;
  cnic_front_url?: string;
  cnic_back_url?: string;
  vehicle_photo_url?: string;
  driving_license_url?: string;
  document_urls?: string[];
  availability?: 'online' | 'offline' | 'on_delivery';
}

@Injectable()
export class RiderService {
  constructor(
    @InjectModel(Rider.name) private readonly riderModel: Model<RiderDocument>,
    private readonly pssClient: PssClientService,
  ) {}

  async create(dto: CreateRiderDto): Promise<RiderDocument> {
    const existing = await this.riderModel.findOne({
      user_id: new Types.ObjectId(dto.user_id),
    }).exec();
    if (existing) throw new ConflictException('Rider profile already exists for this account');

    const rider = new this.riderModel({
      user_id: new Types.ObjectId(dto.user_id),
      cnic: dto.cnic,
      vehicle_type: dto.vehicle_type,
      license_plate: dto.license_plate,
      availability_zone: dto.availability_zone,
    });
    const saved = await rider.save();

    // Submit to PSS immediately (best-effort)
    void this.submitToPss(
      saved._id.toString(),
      dto.user_id,
      { cnic: dto.cnic, vehicle_type: dto.vehicle_type, availability_zone: dto.availability_zone },
    ).catch(() => undefined);

    return saved;
  }

  async findByUserId(userId: string): Promise<RiderDocument | null> {
    return this.riderModel.findOne({ user_id: new Types.ObjectId(userId) }).exec();
  }

  async findById(riderId: string): Promise<RiderDocument | null> {
    return this.riderModel.findById(riderId).exec();
  }

  async update(userId: string, dto: UpdateRiderDto): Promise<RiderDocument> {
    const rider = await this.findByUserId(userId);
    if (!rider) throw new NotFoundException('Rider profile not found');
    Object.assign(rider, dto);
    return rider.save();
  }

  async setAvailability(
    userId: string,
    availability: 'online' | 'offline' | 'on_delivery',
  ): Promise<{ availability: string }> {
    const rider = await this.findByUserId(userId);
    if (!rider) throw new NotFoundException('Rider profile not found');
    rider.availability = availability;
    await rider.save();
    return { availability };
  }

  async submitToPss(
    riderId: string,
    userId: string,
    entityData: Record<string, unknown>,
  ): Promise<void> {
    const result = await this.pssClient.submitForSQ(riderId, userId, 'rider', entityData);
    await this.riderModel.findByIdAndUpdate(riderId, {
      sq_status: result.success ? 'pending' : 'not_submitted',
      sq_request_id: result.sq_request_id ?? null,
    }).exec();
  }

  async getStats(userId: string) {
    const rider = await this.findByUserId(userId);
    if (!rider) throw new NotFoundException('Rider profile not found');
    return {
      sq_status: rider.sq_status,
      sq_level: rider.sq_level,
      sq_badge_label: rider.sq_badge_label,
      availability: rider.availability,
      is_active: rider.is_active,
    };
  }

  toPublic(rider: RiderDocument) {
    return {
      id: rider._id.toString(),
      user_id: rider.user_id.toString(),
      cnic: rider.cnic,
      vehicle_type: rider.vehicle_type,
      license_plate: rider.license_plate,
      availability_zone: rider.availability_zone,
      availability: rider.availability,
      cnic_front_url: rider.cnic_front_url,
      cnic_back_url: rider.cnic_back_url,
      vehicle_photo_url: rider.vehicle_photo_url,
      driving_license_url: rider.driving_license_url,
      document_urls: rider.document_urls,
      sq_status: rider.sq_status,
      sq_level: rider.sq_level,
      sq_badge_label: rider.sq_badge_label,
      is_active: rider.is_active,
    };
  }
}
