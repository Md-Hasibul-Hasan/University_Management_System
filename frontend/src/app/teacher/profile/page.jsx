"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    useLazyGetProfileQuery,
    useUpdateProfileMutation,
} from "@/redux/features/auth/authApi";
import { setUser } from "@/redux/features/auth/authSlice";

import {
    Building2,
    Camera,
    Check,
    Edit3,
    Mail,
    MapPin,
    Phone,
    ShieldCheck,
    User,
    X,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Page = () => {
    const dispatch = useDispatch();

    const { user } = useSelector((state) => state.auth);

    const [getProfile] = useLazyGetProfileQuery();
    const [updateProfile, { isLoading: isUpdating }] =
        useUpdateProfileMutation();

    const [editing, setEditing] = useState(null);
    const [message, setMessage] = useState("");

    const [form, setForm] = useState({
        name: "",
        phone: "",
        address: "",
        image: null,
    });

    /*
    |--------------------------------------------------------------------------
    | Load profile
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (!user) {
            getProfile()
                .unwrap()
                .then((response) => {
                    dispatch(setUser(response.data));
                });
        }
    }, [user, getProfile, dispatch]);

    /*
    |--------------------------------------------------------------------------
    | Sync Redux user -> form
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (!user?.teacher) return;

        setForm({
            name: user.name || "",
            phone: user.teacher.phone || "",
            address: user.teacher.address || "",
            image: null,
        });
    }, [user]);

    if (!user?.teacher) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
            </div>
        );
    }

    const teacher = user.teacher;

    const isAdmin = user?.is_admin === true;
    const isChairman = teacher?.is_head === true;

    const designationLabel = {
        professor: "Professor",
        assistant_professor: "Assistant Professor",
        associate_teacher: "Assistant Teacher",
        lecturer: "Lecturer",
    };

    const getDesignationLabel = () =>
        teacher.designation ? designationLabel[teacher.designation] || teacher.designation : "Lecturer";

    const getRoleLabel = () => {
        if (isAdmin) return "Admin";
        if (isChairman) return "Chairman";
        return getDesignationLabel();
    };

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    const getInitials = (name) => {
        if (!name) return "A";
        return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
    };

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    /*
    |--------------------------------------------------------------------------
    | Save
    |--------------------------------------------------------------------------
    */

    const handleSave = async () => {
        try {
            const data = new FormData();

            if (form.name !== user.name) data.append("name", form.name);
            if (form.phone !== (teacher.phone || "")) data.append("phone", form.phone);
            if (form.address !== (teacher.address || "")) data.append("address", form.address);
            if (form.image) data.append("image", form.image);

            const response = await updateProfile(data).unwrap();
            setMessage(response.message || "Profile updated successfully.");

            const profile = await getProfile().unwrap();
            dispatch(setUser(profile.data));

            setEditing(null);
            setTimeout(() => setMessage(""), 3000);
        } catch (error) {
            console.error(error);
            setMessage(error?.data?.message || "Failed to update profile.");
        }
    };

    const handleCancel = () => {
        setForm({
            name: user.name || "",
            phone: teacher.phone || "",
            address: teacher.address || "",
            image: null,
        });
        setEditing(null);
    };

    /*
    |--------------------------------------------------------------------------
    | Inline field
    |--------------------------------------------------------------------------
    */

    const EditableField = ({ label, value, field, icon: Icon, type = "text" }) => {
        const isEditing = editing === field;

        return (
            <div className="group">
                <div className="flex items-start gap-3">
                    <div className="mt-1 rounded-lg bg-indigo-500/10 p-2">
                        <Icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-foreground/70">
                            {label}
                        </p>

                        {isEditing ? (
                            <div className="mt-2 flex gap-2">
                                <input
                                    autoFocus
                                    type={type}
                                    value={form[field]}
                                    onChange={(e) => handleChange(field, e.target.value)}
                                    className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                                />

                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={isUpdating}
                                    className="rounded-md bg-foreground px-3 text-background hover:opacity-90 disabled:opacity-50"
                                >
                                    <Check className="h-4 w-4" />
                                </button>

                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="rounded-md border px-3 hover:bg-muted"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="mt-1 flex items-center justify-between gap-2">
                                <p className="truncate text-sm font-medium">{value || "Not provided"}</p>
                                <button
                                    type="button"
                                    onClick={() => setEditing(field)}
                                    className="rounded-md p-1.5 text-foreground/70 opacity-0 transition hover:bg-muted hover:text-foreground group-hover:opacity-100"
                                >
                                    <Edit3 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Read-only field
    |--------------------------------------------------------------------------
    */

    const InfoField = ({ label, value, icon: Icon }) => (
        <div className="flex items-start gap-3">
            <div className="mt-1 rounded-lg bg-indigo-500/10 p-2">
                <Icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>

            <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-foreground/70">
                    {label}
                </p>
                <p className="mt-1 text-sm font-medium">{value || "Not available"}</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="mb-8">
                    <p className="text-sm font-medium text-foreground/70">{getRoleLabel()} Account</p>
                    <h1 className="mt-1 text-3xl font-bold tracking-tight">My Profile</h1>
                    <p className="mt-2 text-sm text-foreground/70">View and update your personal information.</p>
                </div>

                {/* Success message */}
                {message && (
                    <div className="mb-6 flex items-center gap-2 rounded-lg border bg-muted px-4 py-3 text-sm">
                        <Check className="h-4 w-4" />
                        {message}
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-[300px_1fr]">

                    {/* LEFT PROFILE CARD */}
                    <div className="h-fit rounded-2xl border bg-card p-6">
                        <div className="flex flex-col items-center text-center">
                            <div className="relative">
                                <Avatar className="h-28 w-28 ring-2 ring-indigo-500/20">
                                    <AvatarImage
                                        src={`${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}${user.image}`}
                                        alt={user.name}
                                    />
                                    <AvatarFallback className="text-2xl">
                                        {getInitials(user.name)}
                                    </AvatarFallback>
                                </Avatar>

                                <label className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border bg-background shadow-sm hover:bg-muted">
                                    <Camera className="h-4 w-4" />

                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            try {
                                                const data = new FormData();
                                                data.append("image", file);
                                                const response = await updateProfile(data).unwrap();
                                                setMessage(response.message || "Profile image updated successfully.");
                                                const profile = await getProfile().unwrap();
                                                dispatch(setUser(profile.data));
                                                setTimeout(() => setMessage(""), 3000);
                                            } catch (error) {
                                                console.error(error);
                                                setMessage(error?.data?.message || "Failed to update profile image.");
                                            }
                                            e.target.value = "";
                                        }}
                                    />
                                </label>
                            </div>

                            <h2 className="mt-4 text-xl font-semibold">{user.name}</h2>
                            <p className="mt-1 text-sm text-foreground/70">{user.email}</p>

                            <div className="mt-4 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">{getRoleLabel()}</div>
                        </div>

                        <div className="mt-6 border-t pt-6">
                            <InfoField label="Employee ID" value={teacher.employee_id} icon={Building2} />
                            <div className="mt-5">
                                <InfoField label="Department" value={teacher.department} icon={Building2} />
                            </div>
                            <div className="mt-5">
                                <InfoField label="Designation" value={getDesignationLabel()} icon={ShieldCheck} />
                            </div>
                        </div>
                    </div>

                    {/* RIGHT CONTENT */}
                    <div className="space-y-6">

                        {/* Personal Information */}
                        <section className="rounded-2xl border bg-card p-6">
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold">Personal Information</h2>
                                <p className="mt-1 text-sm text-foreground/70">Basic information about your account.</p>
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2">
                                <EditableField label="Full Name" value={form.name} field="name" icon={User} />
                                <InfoField label="Email" value={user.email} icon={Mail} />
                                <EditableField label="Phone" value={form.phone} field="phone" icon={Phone} type="tel" />
                                <EditableField label="Address" value={form.address} field="address" icon={MapPin} />
                            </div>
                        </section>

                        {/* Professional Information */}
                        <section className="rounded-2xl border bg-card p-6">
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold">Professional Information</h2>
                                <p className="mt-1 text-sm text-foreground/70">Professional details managed by the university.</p>
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2">
                                <InfoField label="Employee ID" value={teacher.employee_id} icon={Building2} />
                                <InfoField label="Department" value={teacher.department} icon={Building2} />
                                <InfoField label="Designation" value={getDesignationLabel()} icon={ShieldCheck} />
                                <InfoField label="Department Head" value={teacher.is_head ? "Yes" : "No"} icon={ShieldCheck} />
                            </div>
                        </section>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Page;