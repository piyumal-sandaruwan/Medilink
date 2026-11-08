import { z } from 'zod';

export const registerPatientSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().trim().min(8, 'Phone number must be at least 8 digits').max(20),
});

export const registerDoctorSchema = z.object({
  name: z.string().trim().min(2, 'Doctor name must be at least 2 characters').max(100),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().trim().min(8, 'Phone number must be at least 8 digits').max(20),
  specialization: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid specialization ID'),
  slmcNo: z.string().trim().min(3, 'SLMC registration number is required'),
  experienceYears: z.coerce.number().min(0, 'Experience years cannot be negative'),
  channelingFee: z.coerce.number().min(0, 'Channeling fee cannot be negative'),
  bio: z.string().trim().max(1000).optional().default(''),
  profileImage: z.string().optional().nullable(),
  slmcDocument: z.string().optional().nullable(),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const createHospitalAdminSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().trim().min(8, 'Phone number must be at least 8 digits').max(20),
  hospital: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid hospital ID'),
});

export default {
  registerPatientSchema,
  registerDoctorSchema,
  loginSchema,
  createHospitalAdminSchema,
};
