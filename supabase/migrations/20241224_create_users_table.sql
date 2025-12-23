-- Create app_users table
create table if not exists app_users (
  id uuid default gen_random_uuid() primary key,
  username text unique not null,
  password text not null,
  credits int default 0,
  is_admin boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert default admin user if not exists
insert into app_users (username, password, credits, is_admin)
values ('admin', '13142538', 99999, true)
on conflict (username) do nothing;
