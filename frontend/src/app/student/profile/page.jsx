"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    useLazyGetProfileQuery,
    useUpdateProfileMutation,
} from "@/redux/features/auth/authApi";
import { setUser } from "@/redux/features/auth/authSlice";

import {
    Camera,
    Check,
    Edit3,
    GraduationCap,
    Mail,
    MapPin,
    Phone,
    User,
    Users,
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
        father_name: "",
        father_phone: "",
        mother_name: "",
        mother_phone: "",
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
        if (!user?.student) return;

        setForm({
            name: user.name || "",
            phone: user.student.phone || "",
            address: user.student.address || "",
            father_name: user.student.father_name || "",
            father_phone: user.student.father_phone || "",
            mother_name: user.student.mother_name || "",
            mother_phone: user.student.mother_phone || "",
            image: null,
        });
    }, [user]);

    if (!user?.student) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
            </div>
        );
    }

    const student = user.student;

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    const getInitials = (name) => {
        if (!name) return "S";

        return name
            .split(" ")
            .map((word) => word[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
    };

    const handleChange = (field, value) => {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    /*
    |--------------------------------------------------------------------------
    | Save
    |--------------------------------------------------------------------------
    */

    const handleSave = async () => {
        try {
            const data = new FormData();

            if (form.name !== user.name) {
                data.append("name", form.name);
            }

            if (form.phone !== (student.phone || "")) {
                data.append("phone", form.phone);
            }

            if (form.address !== (student.address || "")) {
                data.append("address", form.address);
            }

            if (form.father_name !== (student.father_name || "")) {
                data.append("father_name", form.father_name);
            }

            if (form.father_phone !== (student.father_phone || "")) {
                data.append("father_phone", form.father_phone);
            }

            if (form.mother_name !== (student.mother_name || "")) {
                data.append("mother_name", form.mother_name);
            }

            if (form.mother_phone !== (student.mother_phone || "")) {
                data.append("mother_phone", form.mother_phone);
            }

            if (form.image) {
                data.append("image", form.image);
            }

            const response = await updateProfile(data).unwrap();

            setMessage(response.message || "Profile updated successfully.");

            /*
             * Get fresh profile after update
             */
            const profile = await getProfile().unwrap();

            dispatch(setUser(profile.data));

            setEditing(null);

            setTimeout(() => {
                setMessage("");
            }, 3000);
        } catch (error) {
            console.error(error);

            setMessage(
                error?.data?.message ||
                "Failed to update profile."
            );
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Cancel editing
    |--------------------------------------------------------------------------
    */

    const handleCancel = () => {
        setForm({
            name: user.name || "",
            phone: student.phone || "",
            address: student.address || "",
            father_name: student.father_name || "",
            father_phone: student.father_phone || "",
            mother_name: student.mother_name || "",
            mother_phone: student.mother_phone || "",
            image: null,
        });

        setEditing(null);
    };

    /*
    |--------------------------------------------------------------------------
    | Inline field
    |--------------------------------------------------------------------------
    */

    const EditableField = ({
        label,
        value,
        field,
        icon: Icon,
        type = "text",
    }) => {
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
                                    onChange={(e) =>
                                        handleChange(
                                            field,
                                            e.target.value
                                        )
                                    }
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
                                <p className="truncate text-sm font-medium">
                                    {value || "Not provided"}
                                </p>

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

    const InfoField = ({
        label,
        value,
        icon: Icon,
    }) => {
        return (
            <div className="flex items-start gap-3">
                <div className="mt-1 rounded-lg bg-indigo-500/10 p-2">
                    <Icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>

                <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-foreground/70">
                        {label}
                    </p>

                    <p className="mt-1 text-sm font-medium">
                        {value || "Not available"}
                    </p>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="mb-8">
                    <p className="text-sm font-medium text-foreground/70">
                        Student Account
                    </p>

                    <h1 className="mt-1 text-3xl font-bold tracking-tight">
                        My Profile
                    </h1>

                    <p className="mt-2 text-sm text-foreground/70">
                        View and update your personal information.
                    </p>
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
                                        src={user.image}
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

                                                const response =
                                                    await updateProfile(data).unwrap();

                                                setMessage(
                                                    response.message ||
                                                    "Profile image updated successfully."
                                                );

                                                const profile =
                                                    await getProfile().unwrap();

                                                dispatch(setUser(profile.data));

                                                setTimeout(() => {
                                                    setMessage("");
                                                }, 3000);

                                            } catch (error) {
                                                console.error(error);

                                                setMessage(
                                                    error?.data?.message ||
                                                    "Failed to update profile image."
                                                );
                                            }

                                            e.target.value = "";
                                        }}
                                    />
                                </label>
                            </div>

                            <h2 className="mt-4 text-xl font-semibold">
                                {user.name}
                            </h2>

                            <p className="mt-1 text-sm text-foreground/70">
                                {user.email}
                            </p>

                            <div className="mt-4 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                                Student
                            </div>
                        </div>

                        <div className="mt-6 border-t pt-6">
                            <InfoField
                                label="Student ID"
                                value={student.student_id}
                                icon={GraduationCap}
                            />

                            <div className="mt-5">
                                <InfoField
                                    label="Department"
                                    value={student.department}
                                    icon={GraduationCap}
                                />
                            </div>

                            <div className="mt-5">
                                <InfoField
                                    label="Session"
                                    value={student.session}
                                    icon={GraduationCap}
                                />
                            </div>
                        </div>
                    </div>

                    {/* RIGHT CONTENT */}
                    <div className="space-y-6">

                        {/* Personal Information */}
                        <section className="rounded-2xl border bg-card p-6">

                            <div className="mb-6">
                                <h2 className="text-lg font-semibold">
                                    Personal Information
                                </h2>

                                <p className="mt-1 text-sm text-foreground/70">
                                    Basic information about your account.
                                </p>
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2">

                                <EditableField
                                    label="Full Name"
                                    value={form.name}
                                    field="name"
                                    icon={User}
                                />

                                <InfoField
                                    label="Email"
                                    value={user.email}
                                    icon={Mail}
                                />

                                <EditableField
                                    label="Phone"
                                    value={form.phone}
                                    field="phone"
                                    icon={Phone}
                                    type="tel"
                                />

                                <EditableField
                                    label="Address"
                                    value={form.address}
                                    field="address"
                                    icon={MapPin}
                                />
                            </div>
                        </section>

                        {/* Academic Information */}
                        <section className="rounded-2xl border bg-card p-6">

                            <div className="mb-6">
                                <h2 className="text-lg font-semibold">
                                    Academic Information
                                </h2>

                                <p className="mt-1 text-sm text-foreground/70">
                                    Academic information managed by the university.
                                </p>
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2">

                                <InfoField
                                    label="Student ID"
                                    value={student.student_id}
                                    icon={GraduationCap}
                                />

                                <InfoField
                                    label="Department"
                                    value={student.department}
                                    icon={GraduationCap}
                                />

                                <InfoField
                                    label="Session"
                                    value={student.session}
                                    icon={GraduationCap}
                                />

                                <InfoField
                                    label="Year / Semester"
                                    value={student.year_semester}
                                    icon={GraduationCap}
                                />

                                <InfoField
                                    label="CGPA"
                                    value={student.cgpa}
                                    icon={GraduationCap}
                                />
                            </div>
                        </section>

                        {/* Family Information */}
                        <section className="rounded-2xl border bg-card p-6">

                            <div className="mb-6">
                                <h2 className="text-lg font-semibold">
                                    Family Information
                                </h2>

                                <p className="mt-1 text-sm text-foreground/70">
                                    Parent and guardian contact information.
                                </p>
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2">

                                <EditableField
                                    label="Father's Name"
                                    value={form.father_name}
                                    field="father_name"
                                    icon={Users}
                                />

                                <EditableField
                                    label="Father's Phone"
                                    value={form.father_phone}
                                    field="father_phone"
                                    icon={Phone}
                                    type="tel"
                                />

                                <EditableField
                                    label="Mother's Name"
                                    value={form.mother_name}
                                    field="mother_name"
                                    icon={Users}
                                />

                                <EditableField
                                    label="Mother's Phone"
                                    value={form.mother_phone}
                                    field="mother_phone"
                                    icon={Phone}
                                    type="tel"
                                />
                            </div>
                        </section>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Page;